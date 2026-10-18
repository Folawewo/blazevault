# BlazeVault

Autonomous payment streaming and trustless milestone escrow protocol native to Bitcoin Cash (BCH Chipnet & Mainnet).

BlazeVault brings programmable financial automation to Bitcoin Cash using native UTXO introspection covenants (CHIP-2021-05). It enables second-by-second continuous satoshi streaming for payroll, subscriptions, and grants, alongside multi-party milestone escrows with automated dispute resolution.


## Key Features

 **Linear Continuous Streaming (`BlazeStream`)**: Satoshis flow smoothly second-by-second from sender to recipient with zero centralized custodian risk.
 **Milestone Escrow Covenants (`BlazeEscrow`)**: Funds unlock progressively across verified deliverables via P2PKH introspection covenants (`LockingBytecodeP2PKH`).
 **Dispute Resolution Mechanism**: Designated protocol arbiters can partition contested vault balances trustlessly between seller and buyer.
 **Timelock Guarantees**: Absolute locktimes (`OP_CHECKLOCKTIMEVERIFY`) safeguard sender and buyer deposits with guaranteed safety refunds.
 **Multi-Asset Support**: Operates natively on BCH satoshis and CashTokens / PUSD fungible stablecoins.
 **Sub-Cent Settlement**: Full covenant validation occurs on-chain with standard ~200 satoshi miner fees.


## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BLAZEVAULT PROTOCOL                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│      BlazeStream.cash         │       │        BlazeEscrow.cash        │
├───────────────────────────────┤       ├────────────────────────────────┤
│ • claim(recipient, amount)    │       │ • release(buyer, amount)       │
│ • cancel(sender)              │       │ • refund(buyer, deadline)      │
│ • refund(sender, stopTime)    │       │ • dispute(arbiter, shares)     │
└──────────────┬────────────────┘       └──────────────┬─────────────────┘
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
             ┌───────────────────────────────────────────┐
             │         BCH Native Introspection          │
             ├───────────────────────────────────────────┤
             │ • OP_OUTPUTBYTECODE                       │
             │ • OP_CHECKLOCKTIMEVERIFY                  │
             │ • LockingBytecodeP2PKH(pkh)               │
             │ • tx.outputs[n].value >= threshold        │
             └───────────────────────────────────────────┘
```


## Smart Contract Specification

### 1. BlazeStream (`contracts/BlazeStream.cash`)

| Function | Signer | Covenant Verification Condition |
| :--- | :--- | :--- |
| `claim` | Recipient | `hash160(recipientPk) == recipientPkh && tx.time >= claimTime && tx.outputs[0].lockingBytecode == recipientLockingBytecode && tx.outputs[0].value >= claimAmount` |
| `cancel` | Sender | `hash160(senderPk) == senderPkh && checkSig(senderSig, senderPk)` |
| `refund` | Sender | `tx.time >= stopTime && hash160(senderPk) == senderPkh && checkSig(senderSig, senderPk)` |

### 2. BlazeEscrow (`contracts/BlazeEscrow.cash`)

| Function | Signer | Covenant Verification Condition |
| :--- | :--- | :--- |
| `release` | Buyer | `hash160(buyerPk) == buyerPkh && tx.outputs[0].lockingBytecode == sellerLockingBytecode && tx.outputs[0].value >= releaseAmount` |
| `refund` | Buyer | `tx.time >= deadline && hash160(buyerPk) == buyerPkh && checkSig(buyerSig, buyerPk)` |
| `dispute` | Arbiter | `hash160(arbiterPk) == arbiterPkh && tx.outputs[0].lockingBytecode == sellerBytecode && tx.outputs[1].lockingBytecode == buyerBytecode && sellerShare + buyerShare <= totalAmount` |


## Test Suite Verification

BlazeVault includes an automated test suite executed against CashScript 0.14 and Libauth simulation engine:

```bash
npm test
```

### Test Results

```text
BlazeStream Contract Suite
   correctly compiles and generates deterministic CashAddress and tokenAddress
   allows recipient to claim accrued stream funds with valid locktime and bytecode verification
   rejects claim if output locking bytecode does not match recipient pkh covenant
   allows sender to cancel stream early and recover remaining deposit
   rejects cancel call from unauthorized non-sender signature
   allows sender to execute full refund after stopTime expiration
   rejects refund if transaction locktime has not reached stopTime
BlazeStream Contract Suite

BlazeEscrow Contract Suite
   correctly initializes BlazeEscrow covenant contract
   allows buyer to release milestone payment to seller
   rejects milestone release if output recipient is not seller locking bytecode
   allows arbiter to resolve dispute and split escrow balance between seller and buyer
   rejects dispute resolution from unauthorized arbiter signature
   allows buyer to claim refund after deadline passes
   rejects buyer refund prior to deadline expiration
BlazeEscrow Contract Suite

ℹ tests 14 | pass 14 | fail 0
```


## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone https://github.com/Folawewo/blazevault.git
cd blazevault
npm install
npm install --prefix frontend
```

### Compile Smart Contracts

```bash
npm run compile
```

Outputs compiled bytecode artifacts into `artifacts/BlazeStream.json` and `artifacts/BlazeEscrow.json`.

### Run Contract Tests

```bash
npm test
```

### Run Frontend Dashboard

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build Production Bundle

```bash
npm run build
```

## Chipnet Testnet Deployment Details

- **Network**: Bitcoin Cash Chipnet (Testnet4)
- **Explorer**: [https://chipnet.imaginary.cash/](https://chipnet.imaginary.cash/)
- **Faucet**: [https://chipnet.imaginary.cash/](https://chipnet.imaginary.cash/)
- **CashScript Version**: `^0.14.0`
- **Compiler**: `cashc ^0.14.0`
- **Address Format**: CashAddress (`bchtest:p...` / `bchtest:r...`)


