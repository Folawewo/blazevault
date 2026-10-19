import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Stream, WalletProfile } from '../types';
import { StreamCard } from './StreamCard';
import { formatBch } from '../utils/formatters';
import { streamSnapshot } from '../utils/streamMath';

interface StreamViewProps {
  streams: Stream[];
  activeWallet: WalletProfile;
  onOpenCreateModal: () => void;
  onClaim: (streamId: string, amountSats: number) => void;
  onCancel: (streamId: string) => void;
  onRefund: (streamId: string) => void;
}

export function StreamView({ streams, activeWallet, onOpenCreateModal, onClaim, onCancel, onRefund }: StreamViewProps) {
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);

  const active = streams.filter(stream => stream.status === 'active');
  const visible = streams.filter(stream => filter === 'all' || (filter === 'active' ? stream.status === 'active' : [stream.senderAddress, stream.recipientAddress].some(address => address.toLowerCase() === activeWallet.address.toLowerCase())));
  const selected = visible.find(stream => stream.id === selectedId) ?? visible[0];
  const total = streams.reduce((sum, stream) => sum + stream.totalAmountSats, 0);

  const select = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 900px)').matches) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return <section className="workspace-page" aria-labelledby="streams-heading">
    <div className="workspace-intro">
      <div><div className="workspace-kicker">01 / CONTINUOUS PAYMENTS</div><h1 id="streams-heading">Payment streams</h1><p>Every scheduled payment, and what can be claimed right now.</p></div>
      <button className="action-primary" onClick={onOpenCreateModal}>Create stream <ArrowUpRight size={16} aria-hidden="true" /></button>
    </div>
    <div className="workspace-facts" aria-label="Stream overview">
      <div><span>Volume scheduled</span><strong>{formatBch(total)} <small>BCH</small></strong></div>
      <div><span>Active streams</span><strong>{active.length} <small>of {streams.length}</small></strong></div>
      <div className="flow-fact"><span>Current flow</span><strong>{active.reduce((sum, stream) => sum + streamSnapshot(stream, now).satsPerSecond, 0).toLocaleString()} <small>sats / sec</small></strong></div>
    </div>
    <div className="workspace-layout">
      <div className="workspace-register-rail">
      <div className="workspace-section-label stream-register-label"><span>Stream register</span><span>{visible.length} shown</span></div>
      <div className="register" aria-label="Streams">
        <div className="register-filters" role="group" aria-label="Filter streams">
          {([['all', 'All'], ['my', 'Mine'], ['active', 'Active']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        {visible.length ? <div className="register-items">{visible.map(stream => {
          const snapshot = streamSnapshot(stream, now);
          return <button key={stream.id} className="register-item" data-selected={selected?.id === stream.id} onClick={() => select(stream.id)} aria-current={selected?.id === stream.id ? 'true' : undefined}>
            <span className="register-item-top"><span className="register-title">{stream.title}</span><span className={`status-word status-${stream.status}`}>{stream.status}</span></span>
            <span className="register-description">{stream.senderName.split(' ')[0]} → {stream.recipientName.split(' ')[0]} <span aria-hidden="true">·</span> {stream.tokenSymbol}</span>
            <span className="register-item-bottom"><strong>{formatBch(stream.totalAmountSats)} <small>{stream.tokenSymbol}</small></strong><span>{stream.status === 'active' ? `${snapshot.progress.toFixed(0)}% streamed` : stream.status}</span></span>
            <span className="progress-track" role="progressbar" aria-label={`${stream.title} streamed`} aria-valuenow={Math.round(snapshot.progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${snapshot.progress}%` }} /></span>
          </button>;
        })}</div> : <div className="register-empty">No streams match this filter.</div>}
      </div>
      </div>
      <div ref={detailRef} className="workspace-detail">{selected ? <StreamCard stream={selected} activeWallet={activeWallet} now={now} onClaim={onClaim} onCancel={onCancel} onRefund={onRefund} /> : <div className="detail-empty">Select another filter or create a stream.</div>}</div>
    </div>
  </section>;
}
