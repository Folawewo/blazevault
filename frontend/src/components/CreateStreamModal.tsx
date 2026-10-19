import { useState } from 'react';
import { X, Flame, Zap, ArrowRight } from 'lucide-react';
import type { WalletProfile } from '../types';
import { useDialog } from '../utils/useDialog';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet: WalletProfile;
  onCreateStream: (data: {
    title: string;
    recipientAddress: string;
    recipientName: string;
    totalAmountBch: number;
    durationHours: number;
    tokenSymbol: 'BCH' | 'PUSD';
  }) => void;
}

export const CreateStreamModal: React.FC<CreateStreamModalProps> = ({
  isOpen,
  onClose,
  activeWallet,
  onCreateStream,
}) => {
  const [title, setTitle] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('bchtest:qq4k8z60x22l6p3c5r3uv9v04x92mupmngs50e82c5');
  const [recipientName, setRecipientName] = useState('Bob (Core Dev / Freelancer)');
  const [totalAmountBch, setTotalAmountBch] = useState('1.5');
  const [durationHours, setDurationHours] = useState('24');
  const [tokenSymbol, setTokenSymbol] = useState<'BCH' | 'PUSD'>('BCH');
  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const amountNum = parseFloat(totalAmountBch) || 0;
  const durationNum = parseFloat(durationHours) || 1;
  const totalSats = Math.floor(amountNum * 100000000);
  const durationSeconds = durationNum * 3600;
  const satsPerSec = durationSeconds > 0 ? Math.round(totalSats / durationSeconds) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !recipientAddress || amountNum <= 0) return;
    onCreateStream({
      title,
      recipientAddress,
      recipientName,
      totalAmountBch: amountNum,
      durationHours: durationNum,
      tokenSymbol,
    });
    onClose();
  };

  return (
    <div className="dialog-overlay fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-screen items-center justify-center">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="create-stream-title" className="dialog-panel relative w-full max-w-xl my-8 p-6 border shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 id="create-stream-title" className="text-base font-bold text-white">Create demo payment stream</h3>
              <p className="text-xs text-slate-400">Preview a BlazeStream schedule without sending a transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close create stream dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="stream-title" className="block font-medium text-slate-300 mb-1.5">Stream Purpose / Title</label>
            <input
              id="stream-title" type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Infrastructure Maintenance Retainer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Token Asset</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTokenSymbol('BCH')}
                  className={`py-2 rounded-xl font-mono font-bold transition-all ${
                    tokenSymbol === 'BCH'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  BCH (Native)
                </button>
                <button
                  type="button"
                  onClick={() => setTokenSymbol('PUSD')}
                  className={`py-2 rounded-xl font-mono font-bold transition-all ${
                    tokenSymbol === 'PUSD'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  PUSD (Stable)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="stream-amount" className="block font-medium text-slate-300 mb-1.5">Total Amount ({tokenSymbol})</label>
              <input
                id="stream-amount" type="number"
                step="0.001"
                min="0.001"
                required
                value={totalAmountBch}
                onChange={(e) => setTotalAmountBch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="stream-recipient" className="font-medium text-slate-300">Recipient CashAddress</label>
              <button
                type="button"
                onClick={() => {
                  setRecipientAddress('bchtest:qq4k8z60x22l6p3c5r3uv9v04x92mupmngs50e82c5');
                  setRecipientName('Bob (Core Dev / Freelancer)');
                }}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Fill Bob (Dev)
              </button>
            </div>
            <input
              id="stream-recipient" type="text"
              required
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setRecipientName('Custom Recipient');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Stream Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '6 Hours', value: '6' },
                { label: '24 Hours', value: '24' },
                { label: '3 Days', value: '72' },
                { label: '7 Days', value: '168' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationHours(opt.value)}
                  className={`py-2 rounded-xl font-medium transition-all ${
                    durationHours === opt.value
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Linear Flow Calculation</div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Streaming Rate:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {satsPerSec.toLocaleString()} sats/sec
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Sender Balance After:</span>
              <span className="font-mono text-slate-200">
                {(activeWallet.balanceBch - amountNum).toFixed(4)} BCH
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <span>Create demo stream</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
