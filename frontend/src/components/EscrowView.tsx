import { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Escrow, WalletProfile } from '../types';
import { EscrowCard } from './EscrowCard';
import { formatBch } from '../utils/formatters';

interface EscrowViewProps {
  escrows: Escrow[];
  activeWallet: WalletProfile;
  onOpenCreateModal: () => void;
  onReleaseMilestone: (escrowId: string, milestoneId: number, amountSats: number) => void;
  onDispute: (escrowId: string, sellerShareSats: number, buyerShareSats: number) => void;
  onRefund: (escrowId: string) => void;
}

export function EscrowView({ escrows, activeWallet, onOpenCreateModal, onReleaseMilestone, onDispute, onRefund }: EscrowViewProps) {
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const active = escrows.filter(escrow => escrow.status === 'active');
  const visible = escrows.filter(escrow => filter === 'all' || (filter === 'active' ? escrow.status === 'active' : [escrow.buyerAddress, escrow.sellerAddress, escrow.arbiterAddress].some(address => address.toLowerCase() === activeWallet.address.toLowerCase())));
  const selected = visible.find(escrow => escrow.id === selectedId) ?? visible[0];
  const locked = active.reduce((sum, escrow) => sum + escrow.totalAmountSats - escrow.milestones.filter(m => m.status === 'released').reduce((paid, m) => paid + m.amountSats, 0), 0);
  const released = escrows.reduce((sum, escrow) => sum + escrow.milestones.filter(m => m.status === 'released').length, 0);

  const select = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 900px)').matches) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return <section className="workspace-page" aria-labelledby="escrows-heading">
    <div className="workspace-intro"><div><div className="workspace-kicker">02 / MILESTONE AGREEMENTS</div><h1 id="escrows-heading">Milestone escrows</h1><p>Review deliverables, release schedules and deadlines.</p></div><button className="action-primary" onClick={onOpenCreateModal}>Create escrow <ArrowUpRight size={16} aria-hidden="true" /></button></div>
    <div className="workspace-facts" aria-label="Escrow overview">
      <div><span>Balance in active vaults</span><strong>{formatBch(locked)} <small>BCH</small></strong></div>
      <div><span>Active agreements</span><strong>{active.length} <small>of {escrows.length}</small></strong></div>
      <div className="release-fact"><span>Milestones released</span><strong>{released}</strong></div>
    </div>
    <div className="workspace-section-label"><span>Agreement register</span><span>{visible.length} shown</span></div>
    <div className="workspace-layout">
      <div className="register" aria-label="Escrows">
        <div className="register-filters" role="group" aria-label="Filter escrows">
          {([['all', 'All'], ['my', 'Mine'], ['active', 'Active']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        {visible.length ? <div className="register-items">{visible.map(escrow => {
          const completed = escrow.milestones.filter(m => m.status === 'released').length;
          const percent = escrow.milestones.length ? completed / escrow.milestones.length * 100 : 0;
          return <button key={escrow.id} className="register-item" data-selected={selected?.id === escrow.id} onClick={() => select(escrow.id)} aria-current={selected?.id === escrow.id ? 'true' : undefined}>
            <span className="register-item-top"><span className="register-title">{escrow.title}</span><span className={`status-word status-${escrow.status}`}>{escrow.status}</span></span>
            <span className="register-description">{escrow.buyerName.split(' ')[0]} → {escrow.sellerName.split(' ')[0]}</span>
            <span className="register-item-bottom"><strong>{formatBch(escrow.totalAmountSats)} <small>BCH</small></strong><span>{completed} / {escrow.milestones.length} released</span></span>
            <span className="progress-track" role="progressbar" aria-label={`${escrow.title} milestone progress`} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={escrow.milestones.length}><span style={{ width: `${percent}%` }} /></span>
          </button>;
        })}</div> : <div className="register-empty">No escrows match this filter.</div>}
      </div>
      <div ref={detailRef} className="workspace-detail">{selected ? <EscrowCard escrow={selected} activeWallet={activeWallet} onReleaseMilestone={onReleaseMilestone} onDispute={onDispute} onRefund={onRefund} /> : <div className="detail-empty">Select another filter or create an escrow.</div>}</div>
    </div>
  </section>;
}
