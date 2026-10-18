import { useState } from 'react';
import { Plus, Flame, TrendingUp, Layers, Zap } from 'lucide-react';
import type { Stream, WalletProfile } from '../types';
import { StreamCard } from './StreamCard';
import { formatBch, formatUsd } from '../utils/formatters';

interface StreamViewProps {
  streams: Stream[];
  activeWallet: WalletProfile;
  onOpenCreateModal: () => void;
  onClaim: (streamId: string, amountSats: number) => void;
  onCancel: (streamId: string) => void;
  onRefund: (streamId: string) => void;
}

export const StreamView: React.FC<StreamViewProps> = ({
  streams,
  activeWallet,
  onOpenCreateModal,
  onClaim,
  onCancel,
  onRefund,
}) => {
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');

  const filteredStreams = streams.filter((s) => {
    if (filter === 'active') return s.status === 'active';
    if (filter === 'my') {
      const addr = activeWallet.address.toLowerCase();
      return s.senderAddress.toLowerCase() === addr || s.recipientAddress.toLowerCase() === addr;
    }
    return true;
  });

  const totalStreamVolumeSats = streams.reduce((acc, s) => acc + s.totalAmountSats, 0);
  const activeStreamsCount = streams.filter((s) => s.status === 'active').length;
  const totalFlowVelocity = streams
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + Math.round(s.totalAmountSats / Math.max(1, s.stopTime - s.startTime)), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Stream Liquidity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {formatBch(totalStreamVolumeSats)}
            </span>
            <span className="text-sm font-bold text-emerald-400">BCH</span>
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            ≈ {formatUsd(totalStreamVolumeSats)} cumulative
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Continuous Streams</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {activeStreamsCount}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Now
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Across {streams.length} registered covenants
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute right-3 top-3 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Global Stream Velocity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {totalFlowVelocity.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-amber-400">sats/sec</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Autonomous second-by-second covenant flow
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
            All Streams ({streams.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'my'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Streams
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'active'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Only ({activeStreamsCount})
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>INITIALIZE NEW STREAM</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStreams.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            activeWallet={activeWallet}
            onClaim={onClaim}
            onCancel={onCancel}
            onRefund={onRefund}
          />
        ))}

        {filteredStreams.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl glass-panel border-dashed border-slate-800">
            <Flame className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-300">No Streams Found</div>
            <p className="text-xs text-slate-500 mt-1">Try switching filters or initialize a new stream.</p>
          </div>
        )}
      </div>
    </div>
  );
};
