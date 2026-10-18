import { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft, Clock, Zap, ShieldAlert, Copy, Check } from 'lucide-react';
import type { Stream, WalletProfile } from '../types';
import { formatBch, formatUsd, truncateAddress, formatTimeRemaining } from '../utils/formatters';

interface StreamCardProps {
  stream: Stream;
  activeWallet: WalletProfile;
  onClaim: (streamId: string, amountSats: number) => void;
  onCancel: (streamId: string) => void;
  onRefund: (streamId: string) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  activeWallet,
  onClaim,
  onCancel,
  onRefund,
}) => {
  const [currentNow, setCurrentNow] = useState(Math.floor(Date.now() / 1000));
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  useEffect(() => {
    if (stream.status !== 'active') return;
    const interval = setInterval(() => {
      setCurrentNow(Math.floor(Date.now() / 1000));
    }, 200);
    return () => clearInterval(interval);
  }, [stream.status]);

  const duration = Math.max(1, stream.stopTime - stream.startTime);
  const elapsed = Math.max(0, Math.min(duration, currentNow - stream.startTime));
  const streamedSats = stream.status === 'completed'
    ? stream.totalAmountSats
    : stream.status === 'cancelled'
    ? stream.claimedAmountSats
    : Math.floor((elapsed / duration) * stream.totalAmountSats);

  const claimableSats = Math.max(0, streamedSats - stream.claimedAmountSats);
  const progressPercent = Math.min(100, Math.max(0, (streamedSats / stream.totalAmountSats) * 100));
  const satsPerSec = Math.round(stream.totalAmountSats / duration);

  const isSender = activeWallet.address.toLowerCase() === stream.senderAddress.toLowerCase();
  const isRecipient = activeWallet.address.toLowerCase() === stream.recipientAddress.toLowerCase();
  const hasEnded = currentNow >= stream.stopTime;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 1500);
  };

  return (
    <div className="group relative rounded-2xl glass-panel glass-panel-hover p-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              {stream.title}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {stream.tokenSymbol}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500">ID: {stream.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="font-mono text-slate-300">{satsPerSec.toLocaleString()} sats/sec</span>
            </span>
          </div>
        </div>

        <div>
          {stream.status === 'active' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <Play className="w-3 h-3 fill-emerald-400" />
              Streaming Live
            </span>
          )}
          {stream.status === 'completed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Stream Completed
            </span>
          )}
          {stream.status === 'cancelled' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <XCircle className="w-3 h-3 text-rose-400" />
              Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="my-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Time Remaining</span>
          </span>
          <span className="font-mono font-medium text-slate-200">
            {stream.status === 'active' ? formatTimeRemaining(stream.stopTime - currentNow) : 'Closed'}
          </span>
        </div>

        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-2xl font-bold tracking-tight text-white flex items-baseline gap-1">
              <span>{formatBch(streamedSats)}</span>
              <span className="text-sm font-semibold text-emerald-400">{stream.tokenSymbol}</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              of {formatBch(stream.totalAmountSats)} {stream.tokenSymbol} ({progressPercent.toFixed(1)}%)
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            ≈ {formatUsd(streamedSats)} USD value streamed
          </div>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-[1px]">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
          <div>
            <div className="text-[11px] text-slate-400">Claimed by Recipient</div>
            <div className="font-mono font-semibold text-slate-200 mt-0.5">
              {formatBch(stream.claimedAmountSats)} {stream.tokenSymbol}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Unclaimed / Available</div>
            <div className="font-mono font-semibold text-emerald-400 mt-0.5">
              {formatBch(claimableSats)} {stream.tokenSymbol}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Sender</span>
            </span>
            {isSender && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">You</span>
            )}
          </div>
          <div className="font-medium text-slate-200">{stream.senderName}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[11px] text-slate-400">{truncateAddress(stream.senderAddress, 6)}</span>
            <button
              onClick={() => copyToClipboard(stream.senderAddress, `sender-${stream.id}`)}
              className="text-slate-500 hover:text-slate-300"
            >
              {copiedAddr === `sender-${stream.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recipient</span>
            </span>
            {isRecipient && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">You</span>
            )}
          </div>
          <div className="font-medium text-slate-200">{stream.recipientName}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[11px] text-slate-400">{truncateAddress(stream.recipientAddress, 6)}</span>
            <button
              onClick={() => copyToClipboard(stream.recipientAddress, `recipient-${stream.id}`)}
              className="text-slate-500 hover:text-slate-300"
            >
              {copiedAddr === `recipient-${stream.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Covenant: {truncateAddress(stream.covenantAddress, 6)}</span>
        </div>

        <div className="flex items-center gap-2">
          {stream.status === 'active' && isRecipient && claimableSats > 0 && (
            <button
              onClick={() => onClaim(stream.id, claimableSats)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Claim {formatBch(claimableSats)} {stream.tokenSymbol}</span>
            </button>
          )}

          {stream.status === 'active' && isSender && (
            <button
              onClick={() => onCancel(stream.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Stream</span>
            </button>
          )}

          {stream.status === 'active' && isSender && hasEnded && (
            <button
              onClick={() => onRefund(stream.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Refund Remaining</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
