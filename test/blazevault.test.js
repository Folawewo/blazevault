import fs from 'fs';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Contract, MockNetworkProvider, SignatureTemplate, TransactionBuilder, utils, randomUtxo } from 'cashscript';
import { lockingBytecodeToCashAddress } from '@bitauth/libauth';

const streamArtifact = JSON.parse(fs.readFileSync('artifacts/BlazeStream.json', 'utf8'));
const escrowArtifact = JSON.parse(fs.readFileSync('artifacts/BlazeEscrow.json', 'utf8'));

function createKey(seed) {
  const priv = new Uint8Array(32);
  priv[31] = seed;
  const template = new SignatureTemplate(priv);
  const pkh = utils.hash160(template.publicKey);
  const script = new Uint8Array([0x76, 0xa9, 0x14, ...pkh, 0x88, 0xac]);
  const address = lockingBytecodeToCashAddress({ bytecode: script, prefix: 'bchtest' }).address;
  return { template, pkh, script, address };
}

describe('BlazeStream Contract Suite', () => {
  let provider;
  let sender;
  let recipient;
  let attacker;
  const startTime = 1000n;
  const stopTime = 5000n;
  const totalAmount = 100000n;

  beforeEach(() => {
    provider = new MockNetworkProvider();
    sender = createKey(1);
    recipient = createKey(2);
    attacker = createKey(9);
  });

  it('correctly compiles and generates deterministic CashAddress and tokenAddress', () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    assert.ok(stream.address.startsWith('bchtest:p'));
    assert.ok(stream.tokenAddress.startsWith('bchtest:r'));
    assert.equal(typeof stream.lockingBytecode, 'string');
    assert.equal(stream.name, 'BlazeStream');
  });

  it('allows recipient to claim accrued stream funds with valid locktime and bytecode verification', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    const claimTime = 2500n;
    const claimAmount = 50000n;
    provider.setBlockHeight(Number(claimTime));

    const unlocker = stream.unlock.claim(recipient.template.publicKey, recipient.template, claimTime, claimAmount);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(claimTime))
      .addInput(utxo, unlocker)
      .addOutput({ to: recipient.address, amount: claimAmount });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects claim if output locking bytecode does not match recipient pkh covenant', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    const claimTime = 2500n;
    const claimAmount = 50000n;
    provider.setBlockHeight(Number(claimTime));

    const unlocker = stream.unlock.claim(recipient.template.publicKey, recipient.template, claimTime, claimAmount);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(claimTime))
      .addInput(utxo, unlocker)
      .addOutput({ to: attacker.address, amount: claimAmount });

    await assert.rejects(async () => {
      await tx.send();
    });
  });

  it('allows sender to cancel stream early and recover remaining deposit', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    const unlocker = stream.unlock.cancel(sender.template.publicKey, sender.template);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: sender.address, amount: 99000n });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects cancel call from unauthorized non-sender signature', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    const unlocker = stream.unlock.cancel(attacker.template.publicKey, attacker.template);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: attacker.address, amount: 99000n });

    await assert.rejects(async () => {
      await tx.send();
    });
  });

  it('allows sender to execute full refund after stopTime expiration', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    provider.setBlockHeight(Number(stopTime + 10n));

    const unlocker = stream.unlock.refund(sender.template.publicKey, sender.template);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(stopTime + 10n))
      .addInput(utxo, unlocker)
      .addOutput({ to: sender.address, amount: 99000n });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects refund if transaction locktime has not reached stopTime', async () => {
    const stream = new Contract(streamArtifact, [sender.pkh, recipient.pkh, startTime, stopTime, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: stream.lockingBytecode });
    provider.addUtxo(stream.address, utxo);

    provider.setBlockHeight(Number(stopTime - 100n));

    const unlocker = stream.unlock.refund(sender.template.publicKey, sender.template);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(stopTime - 100n))
      .addInput(utxo, unlocker)
      .addOutput({ to: sender.address, amount: 99000n });

    await assert.rejects(async () => {
      await tx.send();
    });
  });
});

describe('BlazeEscrow Contract Suite', () => {
  let provider;
  let buyer;
  let seller;
  let arbiter;
  let attacker;
  const deadline = 8000n;
  const totalAmount = 200000n;

  beforeEach(() => {
    provider = new MockNetworkProvider();
    buyer = createKey(3);
    seller = createKey(4);
    arbiter = createKey(5);
    attacker = createKey(8);
  });

  it('correctly initializes BlazeEscrow covenant contract', () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    assert.ok(escrow.address.startsWith('bchtest:p'));
    assert.equal(escrow.name, 'BlazeEscrow');
  });

  it('allows buyer to release milestone payment to seller', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    const milestoneAmount = 100000n;
    const unlocker = escrow.unlock.release(buyer.template.publicKey, buyer.template, milestoneAmount);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: seller.address, amount: milestoneAmount });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects milestone release if output recipient is not seller locking bytecode', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    const milestoneAmount = 100000n;
    const unlocker = escrow.unlock.release(buyer.template.publicKey, buyer.template, milestoneAmount);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: buyer.address, amount: milestoneAmount });

    await assert.rejects(async () => {
      await tx.send();
    });
  });

  it('allows arbiter to resolve dispute and split escrow balance between seller and buyer', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    const sellerShare = 120000n;
    const buyerShare = 78000n;

    const unlocker = escrow.unlock.dispute(arbiter.template.publicKey, arbiter.template, sellerShare, buyerShare);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: seller.address, amount: sellerShare })
      .addOutput({ to: buyer.address, amount: buyerShare });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects dispute resolution from unauthorized arbiter signature', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    const sellerShare = 100000n;
    const buyerShare = 98000n;

    const unlocker = escrow.unlock.dispute(attacker.template.publicKey, attacker.template, sellerShare, buyerShare);
    const tx = new TransactionBuilder({ provider })
      .addInput(utxo, unlocker)
      .addOutput({ to: seller.address, amount: sellerShare })
      .addOutput({ to: buyer.address, amount: buyerShare });

    await assert.rejects(async () => {
      await tx.send();
    });
  });

  it('allows buyer to claim refund after deadline passes', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    provider.setBlockHeight(Number(deadline + 50n));

    const unlocker = escrow.unlock.refund(buyer.template.publicKey, buyer.template);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(deadline + 50n))
      .addInput(utxo, unlocker)
      .addOutput({ to: buyer.address, amount: 198000n });

    const result = await tx.send();
    assert.ok(result.txid);
    assert.equal(result.txid.length, 64);
  });

  it('rejects buyer refund prior to deadline expiration', async () => {
    const escrow = new Contract(escrowArtifact, [buyer.pkh, seller.pkh, arbiter.pkh, deadline, totalAmount], { provider });
    const utxo = randomUtxo({ satoshis: totalAmount, lockingBytecode: escrow.lockingBytecode });
    provider.addUtxo(escrow.address, utxo);

    provider.setBlockHeight(Number(deadline - 500n));

    const unlocker = escrow.unlock.refund(buyer.template.publicKey, buyer.template);
    const tx = new TransactionBuilder({ provider })
      .setLocktime(Number(deadline - 500n))
      .addInput(utxo, unlocker)
      .addOutput({ to: buyer.address, amount: 198000n });

    await assert.rejects(async () => {
      await tx.send();
    });
  });
});
