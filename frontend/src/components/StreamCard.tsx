import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { Stream, WalletProfile } from '../types';
import { formatBch, formatTimeRemaining, truncateAddress } from '../utils/formatters';
import { streamSnapshot } from '../utils/streamMath';

interface StreamCardProps {
  stream: Stream;
  activeWallet: WalletProfile;
  now: number;
  onClaim: (id: string, amountSats: number) => void;
  onCancel: (id: string) => void;
  onRefund: (id: string) => void;
}

export function StreamCard({ stream, activeWallet, now, onClaim, onCancel, onRefund }: StreamCardProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { streamedSats, claimableSats, progress, satsPerSecond, hasEnded } = streamSnapshot(stream, now);
  const isSender = activeWallet.address.toLowerCase() === stream.senderAddress.toLowerCase();
  const isRecipient = activeWallet.address.toLowerCase() === stream.recipientAddress.toLowerCase();

  const copy = async (address: string, key: string) => {
    try { await navigator.clipboard.writeText(address); setCopied(key); window.setTimeout(() => setCopied(null), 1600); }
    catch { setCopied(null); }
  };

  return <article className="detail-sheet" aria-labelledby={`stream-detail-${stream.id}`}>
    <div className="detail-overline"><span>STREAM / {stream.id.toUpperCase()}</span><span className={`status-word status-${stream.status}`}>{stream.status}</span></div>
    <h2 id={`stream-detail-${stream.id}`} className="detail-title">{stream.title}</h2>
    <p className="detail-subtitle">{stream.status === 'active' ? 'Value flows continuously over the scheduled period.' : `This stream is ${stream.status}.`} <span className="asset-mark">{stream.tokenSymbol}</span></p>

    <div className="detail-value-block">
      <div><span className="detail-label">Streamed so far</span><div className="detail-big-value"><span>{formatBch(streamedSats)}</span><small>{stream.tokenSymbol}</small></div></div>
      <div className="detail-side-value"><span className="detail-label">Scheduled total</span><strong>{formatBch(stream.totalAmountSats)} {stream.tokenSymbol}</strong></div>
    </div>
    <div className="progress-track detail-progress" role="progressbar" aria-label="Payment progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
    <div className="detail-progress-caption"><span>{progress.toFixed(1)}% streamed</span><span>{stream.status === 'active' ? `${formatTimeRemaining(stream.stopTime - now)} remaining` : 'Schedule closed'}</span></div>

    <div className="detail-number-grid">
      <div><span className="detail-label">Available to claim</span><strong className="detail-emphasis">{formatBch(claimableSats)} <small>{stream.tokenSymbol}</small></strong></div>
      <div><span className="detail-label">Already claimed</span><strong>{formatBch(stream.claimedAmountSats)} <small>{stream.tokenSymbol}</small></strong></div>
      <div><span className="detail-label">Flow rate</span><strong>{satsPerSecond.toLocaleString()} <small>sats / sec</small></strong></div>
    </div>

    <div className="detail-section"><h3>Participants</h3>
      <div className="identity-row"><div><span className="detail-label">Sender {isSender && <em>· you</em>}</span><strong>{stream.senderName}</strong><code>{truncateAddress(stream.senderAddress, 8)}</code></div><button className="copy-button" onClick={() => copy(stream.senderAddress, 'sender')} aria-label="Copy sender address">{copied === 'sender' ? <Check size={16} /> : <Copy size={16} />}</button></div>
      <div className="identity-row"><div><span className="detail-label">Recipient {isRecipient && <em>· you</em>}</span><strong>{stream.recipientName}</strong><code>{truncateAddress(stream.recipientAddress, 8)}</code></div><button className="copy-button" onClick={() => copy(stream.recipientAddress, 'recipient')} aria-label="Copy recipient address">{copied === 'recipient' ? <Check size={16} /> : <Copy size={16} />}</button></div>
    </div>

    <div className="detail-section detail-technical"><h3>Contract reference</h3><div className="identity-row"><div><span className="detail-label">Simulated covenant address</span><code>{truncateAddress(stream.covenantAddress, 12)}</code></div><button className="copy-button" onClick={() => copy(stream.covenantAddress, 'covenant')} aria-label="Copy covenant address">{copied === 'covenant' ? <Check size={16} /> : <Copy size={16} />}</button></div></div>

    <div className="detail-actions">
      {stream.status === 'active' && isRecipient && claimableSats > 0 && <button className="action-primary" onClick={() => onClaim(stream.id, claimableSats)}>Claim {formatBch(claimableSats)} {stream.tokenSymbol}</button>}
      {stream.status === 'active' && isSender && hasEnded && <button className="action-secondary" onClick={() => { if (window.confirm(`Refund remaining value for ${stream.title} in this demo?`)) onRefund(stream.id); }}>Refund remaining</button>}
      {stream.status === 'active' && isSender && <button className="action-text action-danger" onClick={() => { if (window.confirm(`Cancel ${stream.title}? This updates the demo stream.`)) onCancel(stream.id); }}>Cancel stream</button>}
      {stream.status === 'active' && !isSender && !isRecipient && <span className="detail-hint">Switch to a participating demo wallet to manage this stream.</span>}
    </div>
  </article>;
}
