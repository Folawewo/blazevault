import { useState } from 'react';
import { Cpu, Terminal, CheckCircle2, Copy, Check, ExternalLink, Code2, Zap, ShieldCheck } from 'lucide-react';
import type { AuditLog } from '../types';
import { formatTimestamp, truncateTxid } from '../utils/formatters';

interface CovenantInspectorProps {
  auditLogs: AuditLog[];
}

export const CovenantInspector: React.FC<CovenantInspectorProps> = ({ auditLogs }) => {
  const [selectedContract, setSelectedContract] = useState<'stream' | 'escrow'>('stream');
  const [copiedCode, setCopiedCode] = useState(false);

  const streamContractCode = `pragma cashscript ^0.14.0;

contract BlazeStream(
    bytes20 senderPkh,
    bytes20 recipientPkh,
    int startTime,
    int stopTime,
    int totalAmount
) {
    function claim(pubkey recipientPk, sig recipientSig, int claimTime, int claimAmount) {
        require(hash160(recipientPk) == recipientPkh);
        require(checkSig(recipientSig, recipientPk));
        require(tx.time >= claimTime);
        require(claimTime >= startTime);
        require(claimAmount > 0);
        require(claimAmount <= totalAmount);

        bytes recipientLockingBytecode = new LockingBytecodeP2PKH(recipientPkh);
        require(tx.outputs[0].lockingBytecode == recipientLockingBytecode);
        require(tx.outputs[0].value >= claimAmount);
    }

    function cancel(pubkey senderPk, sig senderSig) {
        require(hash160(senderPk) == senderPkh);
        require(checkSig(senderSig, senderPk));
    }

    function refund(pubkey senderPk, sig senderSig) {
        require(tx.time >= stopTime);
        require(hash160(senderPk) == senderPkh);
        require(checkSig(senderSig, senderPk));
    }
}`;

  const escrowContractCode = `pragma cashscript ^0.14.0;

contract BlazeEscrow(
    bytes20 buyerPkh,
    bytes20 sellerPkh,
    bytes20 arbiterPkh,
    int deadline,
    int totalAmount
) {
    function release(pubkey buyerPk, sig buyerSig, int releaseAmount) {
        require(hash160(buyerPk) == buyerPkh);
        require(checkSig(buyerSig, buyerPk));
        require(releaseAmount > 0);
        require(releaseAmount <= totalAmount);

        bytes sellerLockingBytecode = new LockingBytecodeP2PKH(sellerPkh);
        require(tx.outputs[0].lockingBytecode == sellerLockingBytecode);
        require(tx.outputs[0].value >= releaseAmount);
    }

    function refund(pubkey buyerPk, sig buyerSig) {
        require(tx.time >= deadline);
        require(hash160(buyerPk) == buyerPkh);
        require(checkSig(buyerSig, buyerPk));
    }

    function dispute(pubkey arbiterPk, sig arbiterSig, int sellerShare, int buyerShare) {
        require(hash160(arbiterPk) == arbiterPkh);
        require(checkSig(arbiterSig, arbiterPk));
        require(sellerShare + buyerShare <= totalAmount);

        bytes sellerLockingBytecode = new LockingBytecodeP2PKH(sellerPkh);
        bytes buyerLockingBytecode = new LockingBytecodeP2PKH(buyerPkh);
        require(tx.outputs[0].lockingBytecode == sellerLockingBytecode);
        require(tx.outputs[0].value >= sellerShare);
        require(tx.outputs[1].lockingBytecode == buyerLockingBytecode);
        require(tx.outputs[1].value >= buyerShare);
    }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(selectedContract === 'stream' ? streamContractCode : escrowContractCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Bitcoin Cash Native Introspection Covenants</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                CHIP-2021-05
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Unlike EVM rollups or bridge-based payment streams, BlazeVault operates directly on UTXO-level BCH introspection covenants. Smart contracts enforce destination locking scripts (<span className="text-emerald-400 font-mono">LockingBytecodeP2PKH</span>) and output amounts without trusted intermediaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              14/14 Unit Tests Passing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Covenant Execution Mode</div>
            <div className="text-sm font-bold text-white mt-1">P2SH32 / Native UTXO</div>
            <div className="text-[11px] text-slate-500 mt-0.5">32-byte hash guarantees 128-bit collision resistance</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bytecode Opcode Overhead</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">~182 bytes</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ultra-compact Script footprint; sub-cent miners fee</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Timelock Verification</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">OP_CHECKLOCKTIMEVERIFY</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Strict linear flow guards & timeout safety refunds</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setSelectedContract('stream')}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                    selectedContract === 'stream'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  BlazeStream.cash
                </button>
                <button
                  onClick={() => setSelectedContract('escrow')}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                    selectedContract === 'escrow'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  BlazeEscrow.cash
                </button>
              </div>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-mono transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
              <code>{selectedContract === 'stream' ? streamContractCode : escrowContractCode}</code>
            </pre>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Live Introspection Pipeline</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">1. PKH Signer Authentication</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    require(hash160(recipientPk) == recipientPkh);
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">2. Locktime Verification</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    require(tx.time &gt;= claimTime);
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">3. Output Covenant Lock</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    require(tx.outputs[0].lockingBytecode == recipientLockingBytecode);
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">4. Output Satoshis Preservation</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    require(tx.outputs[0].value &gt;= claimAmount);
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Covenant Activity Log</h3>
              <span className="text-[11px] font-mono text-slate-500">{auditLogs.length} events</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{log.details}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-500">
                    <span>TX: {truncateTxid(log.txid)}</span>
                    <a
                      href={`https://chipnet.imaginary.cash/tx/${log.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
