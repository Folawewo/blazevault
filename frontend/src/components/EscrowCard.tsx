import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldAlert, Copy, Check, Gavel } from 'lucide-react';
import type { Escrow, WalletProfile } from '../types';
import { formatBch, formatUsd, truncateAddress, formatTimestamp } from '../utils/formatters';

interface EscrowCardProps {
  escrow: Escrow;
  activeWallet: WalletProfile;
  onReleaseMilestone: (escrowId: string, milestoneId: number, amountSats: number) => void;
  onDispute: (escrowId: string, sellerShareSats: number, buyerShareSats: number) => void;
  onRefund: (escrowId: string) => void;
}

export const EscrowCard: React.FC<EscrowCardProps> = ({
  escrow,
  activeWallet,
  onReleaseMilestone,
  onDispute,
  onRefund,
}) => {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [sellerSplitPercent, setSellerSplitPercent] = useState(50);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const isBuyer = activeWallet.address.toLowerCase() === escrow.buyerAddress.toLowerCase();
  const isSeller = activeWallet.address.toLowerCase() === escrow.sellerAddress.toLowerCase();
  const isArbiter = activeWallet.address.toLowerCase() === escrow.arbiterAddress.toLowerCase();

  const currentNow = Math.floor(Date.now() / 1000);
  const isPastDeadline = currentNow >= escrow.deadline;

  const currentMilestone = escrow.milestones[escrow.currentMilestoneIndex];
  const releasedAmountSats = escrow.milestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + m.amountSats, 0);

  const remainingBalanceSats = escrow.totalAmountSats - releasedAmountSats;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 1500);
  };

  const handleConfirmDispute = () => {
    const sellerShare = Math.floor((sellerSplitPercent / 100) * remainingBalanceSats);
    const buyerShare = remainingBalanceSats - sellerShare;
    onDispute(escrow.id, sellerShare, buyerShare);
    setShowDisputeModal(false);
  };

  return (
    <div className="group relative rounded-2xl glass-panel glass-panel-hover p-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              {escrow.title}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              3 Milestones
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500">VAULT: {escrow.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Deadline: {formatTimestamp(escrow.deadline)}</span>
            </span>
          </div>
        </div>

        <div>
          {escrow.status === 'active' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Covenant Active
            </span>
          )}
          {escrow.status === 'completed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Milestones Released
            </span>
          )}
          {escrow.status === 'disputed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Gavel className="w-3.5 h-3.5" />
              Resolved by Arbiter
            </span>
          )}
          {escrow.status === 'refunded' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Timeout Refunded
            </span>
          )}
        </div>
      </div>

      <div className="my-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="text-xs text-slate-400">Total Locked Escrow Value</div>
            <div className="font-mono text-2xl font-bold text-white flex items-baseline gap-1 mt-0.5">
              <span>{formatBch(escrow.totalAmountSats)}</span>
              <span className="text-sm font-semibold text-cyan-400">BCH</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              ≈ {formatUsd(escrow.totalAmountSats)} in covenant
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Released to Seller</div>
            <div className="font-mono text-lg font-bold text-emerald-400 mt-0.5">
              {formatBch(releasedAmountSats)} BCH
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Remaining: {formatBch(remainingBalanceSats)} BCH
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>Milestone Schedule</span>
            <span className="text-[11px] font-mono text-slate-400">
              {escrow.milestones.filter((m) => m.status === 'released').length} of {escrow.milestones.length} Completed
            </span>
          </div>

          <div className="space-y-2.5">
            {escrow.milestones.map((m, idx) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  m.status === 'released'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : idx === escrow.currentMilestoneIndex && escrow.status === 'active'
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      m.status === 'released'
                        ? 'bg-emerald-500 text-slate-950'
                        : idx === escrow.currentMilestoneIndex && escrow.status === 'active'
                        ? 'bg-cyan-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status === 'released' ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{m.title}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {formatBch(m.amountSats)} BCH
                      {m.releasedAt && ` • Released ${formatTimestamp(m.releasedAt)}`}
                    </div>
                  </div>
                </div>

                <div>
                  {m.status === 'released' && (
                    <span className="text-[11px] font-mono font-medium text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Paid
                    </span>
                  )}
                  {m.status === 'pending' && idx === escrow.currentMilestoneIndex && escrow.status === 'active' && (
                    <span className="text-[11px] font-mono font-medium text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      In Progress
                    </span>
                  )}
                  {m.status === 'pending' && idx > escrow.currentMilestoneIndex && (
                    <span className="text-[11px] font-mono text-slate-500">Upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-5">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Buyer</span>
            {isBuyer && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400">You</span>
            )}
          </div>
          <div className="font-medium text-slate-200">{escrow.buyerName.split(' ')[0]}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[11px] text-slate-400">{truncateAddress(escrow.buyerAddress, 5)}</span>
            <button onClick={() => copyToClipboard(escrow.buyerAddress, `buyer-${escrow.id}`)}>
              {copiedAddr === `buyer-${escrow.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Seller</span>
            {isSeller && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400">You</span>
            )}
          </div>
          <div className="font-medium text-slate-200">{escrow.sellerName.split(' ')[0]}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[11px] text-slate-400">{truncateAddress(escrow.sellerAddress, 5)}</span>
            <button onClick={() => copyToClipboard(escrow.sellerAddress, `seller-${escrow.id}`)}>
              {copiedAddr === `seller-${escrow.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Arbiter</span>
            {isArbiter && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400">You</span>
            )}
          </div>
          <div className="font-medium text-slate-200">{escrow.arbiterName.split(' ')[0]}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[11px] text-slate-400">{truncateAddress(escrow.arbiterAddress, 5)}</span>
            <button onClick={() => copyToClipboard(escrow.arbiterAddress, `arbiter-${escrow.id}`)}>
              {copiedAddr === `arbiter-${escrow.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Covenant: {truncateAddress(escrow.covenantAddress, 6)}</span>
        </div>

        <div className="flex items-center gap-2">
          {escrow.status === 'active' && isBuyer && currentMilestone && (
            <button
              onClick={() => onReleaseMilestone(escrow.id, currentMilestone.id, currentMilestone.amountSats)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Release Milestone {escrow.currentMilestoneIndex + 1} ({formatBch(currentMilestone.amountSats)} BCH)</span>
            </button>
          )}

          {escrow.status === 'active' && isArbiter && (
            <button
              onClick={() => setShowDisputeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Arbiter Dispute Split</span>
            </button>
          )}

          {escrow.status === 'active' && isBuyer && isPastDeadline && (
            <button
              onClick={() => onRefund(escrow.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeout Refund</span>
            </button>
          )}
        </div>
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex min-h-screen items-center justify-center animate-in fade-in">
          <div className="relative w-full max-w-lg my-8 rounded-2xl glass-panel p-6 border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Arbiter Dispute Settlement</h3>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              As the designated arbiter, you can partition the remaining vault balance (
              <span className="font-mono text-cyan-400 font-semibold">{formatBch(remainingBalanceSats)} BCH</span>) between
              seller and buyer according to covenant introspection rules.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Seller Share: {sellerSplitPercent}%</span>
                <span className="text-slate-300">Buyer Share: {100 - sellerSplitPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sellerSplitPercent}
                onChange={(e) => setSellerSplitPercent(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Seller Output:</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    {formatBch(Math.floor((sellerSplitPercent / 100) * remainingBalanceSats))} BCH
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Buyer Output:</div>
                  <div className="font-mono font-bold text-cyan-400 mt-0.5">
                    {formatBch(remainingBalanceSats - Math.floor((sellerSplitPercent / 100) * remainingBalanceSats))} BCH
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispute}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                Execute Dispute Covenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
