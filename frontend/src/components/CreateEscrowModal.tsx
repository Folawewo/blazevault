import { useState } from 'react';
import { X, ShieldCheck, ArrowRight } from 'lucide-react';
import type { WalletProfile } from '../types';
import { useDialog } from '../utils/useDialog';

interface CreateEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet: WalletProfile;
  onCreateEscrow: (data: {
    title: string;
    sellerAddress: string;
    sellerName: string;
    arbiterAddress: string;
    arbiterName: string;
    deadlineDays: number;
    milestones: { title: string; amountBch: number }[];
  }) => void;
}

export const CreateEscrowModal: React.FC<CreateEscrowModalProps> = ({
  isOpen,
  onClose,
  onCreateEscrow,
}) => {
  const [title, setTitle] = useState('');
  const [sellerAddress, setSellerAddress] = useState('bchtest:qq4k8z60x22l6p3c5r3uv9v04x92mupmngs50e82c5');
  const [sellerName, setSellerName] = useState('Bob (Core Dev / Freelancer)');
  const [arbiterAddress, setArbiterAddress] = useState('bchtest:qr7vj9f52lkn3vxd646u9m2sfd53pxljug4g8q6k0a');
  const [arbiterName, setArbiterName] = useState('Charlie (Protocol Arbiter)');
  const [deadlineDays, setDeadlineDays] = useState('14');

  const [milestone1Title, setMilestone1Title] = useState('Milestone 1: Architectural Specification & Wireframes');
  const [milestone1Amount, setMilestone1Amount] = useState('1.0');

  const [milestone2Title, setMilestone2Title] = useState('Milestone 2: CashScript Smart Contracts & Unit Tests');
  const [milestone2Amount, setMilestone2Amount] = useState('1.5');

  const [milestone3Title, setMilestone3Title] = useState('Milestone 3: Final Production Mainnet Delivery');
  const [milestone3Amount, setMilestone3Amount] = useState('1.5');
  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const m1 = parseFloat(milestone1Amount) || 0;
  const m2 = parseFloat(milestone2Amount) || 0;
  const m3 = parseFloat(milestone3Amount) || 0;
  const totalBch = m1 + m2 + m3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sellerAddress || !arbiterAddress || totalBch <= 0) return;
    onCreateEscrow({
      title,
      sellerAddress,
      sellerName,
      arbiterAddress,
      arbiterName,
      deadlineDays: parseFloat(deadlineDays) || 14,
      milestones: [
        { title: milestone1Title, amountBch: m1 },
        { title: milestone2Title, amountBch: m2 },
        { title: milestone3Title, amountBch: m3 },
      ],
    });
    onClose();
  };

  return (
    <div className="dialog-overlay fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-screen items-center justify-center">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="create-escrow-title" className="dialog-panel relative w-full max-w-xl my-8 p-6 border shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="create-escrow-title" className="text-base font-bold text-white">Create demo milestone escrow</h3>
              <p className="text-xs text-slate-400">Preview an agreement without sending a transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close create escrow dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="escrow-title" className="block font-medium text-slate-300 mb-1.5">Escrow Contract Title</label>
            <input
              id="escrow-title" type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cross-Chain DEX Atomic Swap Module"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="escrow-seller" className="font-medium text-slate-300">Seller CashAddress</label>
                <button
                  type="button"
                  onClick={() => {
                    setSellerAddress('bchtest:qq4k8z60x22l6p3c5r3uv9v04x92mupmngs50e82c5');
                    setSellerName('Bob (Core Dev / Freelancer)');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Fill Bob
                </button>
              </div>
              <input
                type="text"
                required
                id="escrow-seller" value={sellerAddress}
                onChange={(e) => {
                  setSellerAddress(e.target.value);
                  setSellerName('Custom Seller');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="escrow-arbiter" className="font-medium text-slate-300">Arbiter CashAddress</label>
                <button
                  type="button"
                  onClick={() => {
                    setArbiterAddress('bchtest:qr7vj9f52lkn3vxd646u9m2sfd53pxljug4g8q6k0a');
                    setArbiterName('Charlie (Protocol Arbiter)');
                  }}
                  className="text-[11px] text-purple-400 hover:underline"
                >
                  Fill Charlie
                </button>
              </div>
              <input
                type="text"
                required
                id="escrow-arbiter" value={arbiterAddress}
                onChange={(e) => {
                  setArbiterAddress(e.target.value);
                  setArbiterName('Custom Arbiter');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Vault Timelock Deadline</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '7 Days', value: '7' },
                { label: '14 Days', value: '14' },
                { label: '30 Days', value: '30' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDeadlineDays(opt.value)}
                  className={`py-2 rounded-xl font-medium transition-all ${
                    deadlineDays === opt.value
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              3-Stage Milestone Distribution
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Milestone 1 title" value={milestone1Title}
                  onChange={(e) => setMilestone1Title(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <input
                  type="number"
                  step="0.1"
                  aria-label="Milestone 1 amount in BCH" min="0" value={milestone1Amount}
                  onChange={(e) => setMilestone1Amount(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs text-right"
                  placeholder="BCH"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Milestone 2 title" value={milestone2Title}
                  onChange={(e) => setMilestone2Title(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <input
                  type="number"
                  step="0.1"
                  aria-label="Milestone 2 amount in BCH" min="0" value={milestone2Amount}
                  onChange={(e) => setMilestone2Amount(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs text-right"
                  placeholder="BCH"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Milestone 3 title" value={milestone3Title}
                  onChange={(e) => setMilestone3Title(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <input
                  type="number"
                  step="0.1"
                  aria-label="Milestone 3 amount in BCH" min="0" value={milestone3Amount}
                  onChange={(e) => setMilestone3Amount(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs text-right"
                  placeholder="BCH"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 font-semibold">Total Escrow Deposit:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {totalBch.toFixed(4)} BCH
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
                <span>Create demo escrow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
