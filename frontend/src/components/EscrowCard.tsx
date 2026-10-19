import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import type { Escrow, WalletProfile } from '../types';
import { formatBch, formatTimestamp, truncateAddress } from '../utils/formatters';
import { useDialog } from '../utils/useDialog';

interface EscrowCardProps {
  escrow: Escrow;
  activeWallet: WalletProfile;
  onReleaseMilestone: (escrowId: string, milestoneId: number, amountSats: number) => void;
  onDispute: (escrowId: string, sellerShareSats: number, buyerShareSats: number) => void;
  onRefund: (escrowId: string) => void;
}

export function EscrowCard({ escrow, activeWallet, onReleaseMilestone, onDispute, onRefund }: EscrowCardProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [sellerSplit, setSellerSplit] = useState(50);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const dialogRef = useDialog(disputeOpen, () => setDisputeOpen(false));

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 60000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);

  const isBuyer = activeWallet.address.toLowerCase() === escrow.buyerAddress.toLowerCase();
  const isArbiter = activeWallet.address.toLowerCase() === escrow.arbiterAddress.toLowerCase();
  const currentMilestone = escrow.status === 'active' ? escrow.milestones[escrow.currentMilestoneIndex] : undefined;
  const completed = escrow.milestones.filter(m => m.status === 'released').length;
  const releasedSats = escrow.milestones.filter(m => m.status === 'released').reduce((sum, m) => sum + m.amountSats, 0);
  const remainingSats = escrow.totalAmountSats - releasedSats;
  const sellerShare = Math.floor(sellerSplit / 100 * remainingSats);
  const buyerShare = remainingSats - sellerShare;

  const copy = async (address: string, key: string) => {
    try { await navigator.clipboard.writeText(address); setCopied(key); window.setTimeout(() => setCopied(null), 1600); }
    catch { setCopied(null); }
  };

  return <article className="detail-sheet" aria-labelledby={`escrow-detail-${escrow.id}`}>
    <div className="detail-overline"><span>ESCROW / {escrow.id.toUpperCase()}</span><span className={`status-word status-${escrow.status}`}>{escrow.status}</span></div>
    <h2 id={`escrow-detail-${escrow.id}`} className="detail-title">{escrow.title}</h2>
    <p className="detail-subtitle">{completed} of {escrow.milestones.length} milestones released <span aria-hidden="true">·</span> deadline {formatTimestamp(escrow.deadline)}</p>

    {currentMilestone && <div className="decision-panel"><span className="detail-label">CURRENT MILESTONE / {escrow.currentMilestoneIndex + 1} OF {escrow.milestones.length}</span><h3>{currentMilestone.title}</h3><strong>{formatBch(currentMilestone.amountSats)} BCH</strong><p>Release is controlled by the buyer in this demo.</p>
      {isBuyer && <button className="action-primary" onClick={() => { if (window.confirm(`Release ${formatBch(currentMilestone.amountSats)} BCH for milestone ${escrow.currentMilestoneIndex + 1} in this demo?`)) onReleaseMilestone(escrow.id, currentMilestone.id, currentMilestone.amountSats); }}>Release this milestone</button>}
    </div>}

    <div className="detail-value-block"><div><span className="detail-label">Remaining in agreement</span><div className="detail-big-value"><span>{formatBch(remainingSats)}</span><small>BCH</small></div></div><div className="detail-side-value"><span className="detail-label">Total agreement</span><strong>{formatBch(escrow.totalAmountSats)} BCH</strong></div></div>
    <div className="progress-track detail-progress" role="progressbar" aria-label="Milestones released" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={escrow.milestones.length}><span style={{ width: `${escrow.milestones.length ? completed / escrow.milestones.length * 100 : 0}%` }} /></div>
    <div className="detail-progress-caption"><span>{completed} completed</span><span>{escrow.milestones.length - completed} remaining</span></div>

    <div className="detail-section"><h3>Milestone schedule</h3><ol className="milestone-sequence">{escrow.milestones.map((milestone, index) => <li key={milestone.id} data-current={escrow.status === 'active' && index === escrow.currentMilestoneIndex}><span className="milestone-index">{index + 1}</span><div><strong>{milestone.title}</strong><small>{milestone.status === 'released' ? `Released ${milestone.releasedAt ? formatTimestamp(milestone.releasedAt) : ''}` : index === escrow.currentMilestoneIndex && escrow.status === 'active' ? 'Current milestone' : 'Pending'}</small></div><span className="milestone-amount">{formatBch(milestone.amountSats)} BCH</span></li>)}</ol></div>

    <div className="detail-section"><h3>Participants</h3>
      {([['Buyer', escrow.buyerName, escrow.buyerAddress], ['Seller', escrow.sellerName, escrow.sellerAddress], ['Arbiter', escrow.arbiterName, escrow.arbiterAddress]] as const).map(([role, name, address]) => <div className="identity-row" key={role}><div><span className="detail-label">{role}{activeWallet.address.toLowerCase() === address.toLowerCase() && <em> · you</em>}</span><strong>{name}</strong><code>{truncateAddress(address, 8)}</code></div><button className="copy-button" onClick={() => copy(address, role)} aria-label={`Copy ${role.toLowerCase()} address`}>{copied === role ? <Check size={16} /> : <Copy size={16} />}</button></div>)}
    </div>
    <div className="detail-section detail-technical"><h3>Contract reference</h3><div className="identity-row"><div><span className="detail-label">Simulated covenant address</span><code>{truncateAddress(escrow.covenantAddress, 12)}</code></div><button className="copy-button" onClick={() => copy(escrow.covenantAddress, 'covenant')} aria-label="Copy covenant address">{copied === 'covenant' ? <Check size={16} /> : <Copy size={16} />}</button></div></div>
    {escrow.status === 'active' && <div className="detail-actions">
      {isArbiter && <button className="action-secondary" onClick={() => setDisputeOpen(true)}>Resolve dispute</button>}
      {isBuyer && now >= escrow.deadline && <button className="action-text action-danger" onClick={() => { if (window.confirm(`Refund ${escrow.title} in this demo?`)) onRefund(escrow.id); }}>Request timeout refund</button>}
      {!isBuyer && !isArbiter && <span className="detail-hint">Switch to a participating demo wallet to manage this agreement.</span>}
    </div>}

    {disputeOpen && <div className="dialog-overlay fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-screen items-center justify-center"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`dispute-title-${escrow.id}`} className="dialog-panel dispute-dialog w-full max-w-lg p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><span className="workspace-kicker">ARBITER DECISION</span><h2 id={`dispute-title-${escrow.id}`} className="text-xl font-bold">Resolve remaining balance</h2></div><button className="copy-button" onClick={() => setDisputeOpen(false)} aria-label="Close dispute dialog"><X size={18} /></button></div>
      <p className="detail-subtitle mt-3">Allocate {formatBch(remainingSats)} BCH between seller and buyer in this demo. This decision closes the agreement.</p>
      <label htmlFor={`split-${escrow.id}`} className="detail-label block mt-6">Seller share: {sellerSplit}%</label><input id={`split-${escrow.id}`} type="range" min="0" max="100" value={sellerSplit} onChange={event => setSellerSplit(Number(event.target.value))} className="w-full mt-2" />
      <div className="detail-number-grid two-cols"><div><span className="detail-label">Seller receives</span><strong>{formatBch(sellerShare)} BCH</strong></div><div><span className="detail-label">Buyer receives</span><strong>{formatBch(buyerShare)} BCH</strong></div></div>
      <div className="detail-actions"><button className="action-secondary" onClick={() => setDisputeOpen(false)}>Cancel</button><button className="action-primary" onClick={() => { onDispute(escrow.id, sellerShare, buyerShare); setDisputeOpen(false); }}>Confirm split</button></div>
    </div></div>}
  </article>;
}
