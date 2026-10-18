import { useState } from 'react';
import { Plus, ShieldCheck, Lock, CheckCircle2, UserCheck } from 'lucide-react';
import type { Escrow, WalletProfile } from '../types';
import { EscrowCard } from './EscrowCard';
import { formatBch, formatUsd } from '../utils/formatters';

interface EscrowViewProps {
  escrows: Escrow[];
  activeWallet: WalletProfile;
  onOpenCreateModal: () => void;
  onReleaseMilestone: (escrowId: string, milestoneId: number, amountSats: number) => void;
  onDispute: (escrowId: string, sellerShareSats: number, buyerShareSats: number) => void;
  onRefund: (escrowId: string) => void;
}

export const EscrowView: React.FC<EscrowViewProps> = ({
  escrows,
  activeWallet,
  onOpenCreateModal,
  onReleaseMilestone,
  onDispute,
  onRefund,
}) => {
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');

  const filteredEscrows = escrows.filter((e) => {
    if (filter === 'active') return e.status === 'active';
    if (filter === 'my') {
      const addr = activeWallet.address.toLowerCase();
      return (
        e.buyerAddress.toLowerCase() === addr ||
        e.sellerAddress.toLowerCase() === addr ||
        e.arbiterAddress.toLowerCase() === addr
      );
    }
    return true;
  });

  const totalLockedSats = escrows
    .filter((e) => e.status === 'active')
    .reduce((acc, e) => {
      const released = e.milestones
        .filter((m) => m.status === 'released')
        .reduce((sum, m) => sum + m.amountSats, 0);
      return acc + (e.totalAmountSats - released);
    }, 0);

  const totalVaultVolumeSats = escrows.reduce((acc, e) => acc + e.totalAmountSats, 0);
  const totalCompletedMilestones = escrows.reduce(
    (acc, e) => acc + e.milestones.filter((m) => m.status === 'released').length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Locked Escrow Balance</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {formatBch(totalLockedSats)}
            </span>
            <span className="text-sm font-bold text-cyan-400">BCH</span>
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            ≈ {formatUsd(totalLockedSats)} secured in introspection covenants
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Completed Milestones</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {totalCompletedMilestones}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Zero third-party custodian fees
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Escrow Volume</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {formatBch(totalVaultVolumeSats)}
            </span>
            <span className="text-sm font-bold text-purple-400">BCH</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Across {escrows.length} smart covenants
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Vaults ({escrows.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'my'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Escrows
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'active'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Only
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>DEPLOY MILESTONE ESCROW</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEscrows.map((escrow) => (
          <EscrowCard
            key={escrow.id}
            escrow={escrow}
            activeWallet={activeWallet}
            onReleaseMilestone={onReleaseMilestone}
            onDispute={onDispute}
            onRefund={onRefund}
          />
        ))}

        {filteredEscrows.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl glass-panel border-dashed border-slate-800">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-300">No Escrows Found</div>
            <p className="text-xs text-slate-500 mt-1">Try switching filters or deploy a new milestone escrow vault.</p>
          </div>
        )}
      </div>
    </div>
  );
};
