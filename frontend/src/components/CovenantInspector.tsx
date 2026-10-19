import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import streamSource from '../../../contracts/BlazeStream.cash?raw';
import escrowSource from '../../../contracts/BlazeEscrow.cash?raw';
import type { AuditLog } from '../types';
import { formatTimestamp, truncateTxid } from '../utils/formatters';

type ContractName = 'stream' | 'escrow';
type FunctionInfo = { name: string; actor: string; summary: string; checks: string[] };
const contracts: Record<ContractName, { label: string; source: string; purpose: string; functions: FunctionInfo[] }> = {
  stream: {
    label: 'BlazeStream.cash', source: streamSource,
    purpose: 'Scheduled payments with recipient claims and sender recovery paths.',
    functions: [
      { name: 'claim', actor: 'Recipient', summary: 'Pay the recipient when the claim time and output meet the covenant rules.', checks: ['Recipient public key and signature', 'Claim time and start time', 'Recipient output address and minimum value'] },
      { name: 'cancel', actor: 'Sender', summary: 'Allow the sender to close an active stream.', checks: ['Sender public key hash', 'Sender signature'] },
      { name: 'refund', actor: 'Sender', summary: 'Recover funds when the stream has passed its stop time.', checks: ['Transaction time is past stop time', 'Sender public key hash and signature'] },
    ],
  },
  escrow: {
    label: 'BlazeEscrow.cash', source: escrowSource,
    purpose: 'Milestone releases, buyer timeout refunds and arbiter dispute settlement.',
    functions: [
      { name: 'release', actor: 'Buyer', summary: 'Pay the seller for a milestone after buyer approval.', checks: ['Buyer public key and signature', 'Release amount within contract total', 'Seller output address and minimum value'] },
      { name: 'refund', actor: 'Buyer', summary: 'Recover funds when the agreement deadline has passed.', checks: ['Transaction time is past deadline', 'Buyer public key hash and signature'] },
      { name: 'dispute', actor: 'Arbiter', summary: 'Partition the agreement balance between seller and buyer.', checks: ['Arbiter public key and signature', 'Combined shares within contract total', 'Seller and buyer output addresses and minimum values'] },
    ],
  },
};

export function CovenantInspector({ auditLogs }: { auditLogs: AuditLog[] }) {
  const [contractName, setContractName] = useState<ContractName>('stream');
  const [functionName, setFunctionName] = useState('claim');
  const [copied, setCopied] = useState(false);
  const contract = contracts[contractName];
  const functionInfo = contract.functions.find(info => info.name === functionName) ?? contract.functions[0];
  const lines = contract.source.trimEnd().split('\n');
  const start = lines.findIndex(line => line.includes(`function ${functionInfo.name}(`));
  const next = lines.findIndex((line, index) => index > start && line.includes('    function '));
  const end = next > start ? next - 1 : lines.length - 2;

  const chooseContract = (name: ContractName) => { setContractName(name); setFunctionName(contracts[name].functions[0].name); setCopied(false); };
  const copySource = async () => {
    try { await navigator.clipboard.writeText(contract.source); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };

  return <section className="workspace-page inspector-page" aria-labelledby="inspector-heading">
    <div className="workspace-intro"><div><div className="workspace-kicker">03 / CONTRACT REFERENCE</div><h1 id="inspector-heading">Covenant inspector</h1><p>Read the CashScript behind the demo. Source is loaded from the repository.</p></div><span className="inspector-version">CASHCRIPT 0.14</span></div>
    <div className="inspector-contract-tabs" role="tablist" aria-label="Contract source">
      {(Object.keys(contracts) as ContractName[]).map(name => <button key={name} role="tab" aria-selected={contractName === name} onClick={() => chooseContract(name)}>{contracts[name].label}</button>)}
    </div>
    <div className="inspector-description"><strong>{contract.label.replace('.cash', '')}</strong><span>{contract.purpose}</span></div>
    <div className="inspector-layout">
      <div className="source-panel" role="tabpanel" aria-label={`${contract.label} source code`}>
        <div className="source-toolbar"><span>SOURCE / {contract.label}</span><button className="action-secondary" onClick={copySource}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy source'}</button></div>
        <pre className="source-code"><code>{lines.map((line, index) => <span key={index} className="source-line" data-highlight={index >= start && index <= end}><span className="source-line-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{line || ' '}</span></span>)}</code></pre>
      </div>
      <aside className="inspector-aside"><div className="inspector-aside-heading">FUNCTIONS <span>{contract.functions.length}</span></div>
        <div className="function-list">{contract.functions.map(info => <button key={info.name} data-selected={functionInfo.name === info.name} onClick={() => setFunctionName(info.name)}><code>{info.name}()</code><span>{info.actor}</span></button>)}</div>
        <div className="function-explanation"><span className="workspace-kicker">SELECTED FUNCTION</span><h2>{functionInfo.name}()</h2><p>{functionInfo.summary}</p><h3>Checks in source</h3><ul>{functionInfo.checks.map(check => <li key={check}>{check}</li>)}</ul></div>
      </aside>
    </div>
    <div className="activity-section"><div className="workspace-section-label"><span>Demo activity</span><span>{auditLogs.length} events</span></div><div className="activity-list">{auditLogs.length ? auditLogs.map(log => <div className="activity-row" key={log.id}><div><strong>{log.action}</strong><p>{log.details}</p><code>SIMULATED ID / {truncateTxid(log.txid)}</code></div><time dateTime={new Date(log.timestamp * 1000).toISOString()}>{formatTimestamp(log.timestamp)}</time></div>) : <p className="register-empty">No activity in this demo session.</p>}</div></div>
  </section>;
}
