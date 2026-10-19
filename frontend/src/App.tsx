import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StreamView } from './components/StreamView';
import { EscrowView } from './components/EscrowView';
import { CovenantInspector } from './components/CovenantInspector';
import { CreateStreamModal } from './components/CreateStreamModal';
import { CreateEscrowModal } from './components/CreateEscrowModal';
import { NotificationToast } from './components/NotificationToast';
import type { ToastMessage } from './components/NotificationToast';
import {
  WALLET_PROFILES,
  INITIAL_STREAMS,
  INITIAL_ESCROWS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import type { Stream, Escrow, WalletProfile, AuditLog } from './types';
import { formatBch } from './utils/formatters';

export function App() {
  const [activeTab, setActiveTab] = useState<'streams' | 'escrows' | 'inspector'>('streams');
  const [wallets, setWallets] = useState<WalletProfile[]>(WALLET_PROFILES);
  const [activeWallet, setActiveWallet] = useState<WalletProfile>(WALLET_PROFILES[0]);
  const [streams, setStreams] = useState<Stream[]>(INITIAL_STREAMS);
  const [escrows, setEscrows] = useState<Escrow[]>(INITIAL_ESCROWS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [blockHeight, setBlockHeight] = useState(894210);

  const [isCreateStreamOpen, setIsCreateStreamOpen] = useState(false);
  const [isCreateEscrowOpen, setIsCreateEscrowOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlockHeight((h) => h + 1);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const addToast = (title: string, description: string, txid?: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Demo · ${title}`,
      description,
      txid,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  };

  const generateTxid = () => {
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < 64; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };

  const handleClaimFaucet = () => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);
    const faucetAmount = 5.0;

    setWallets((prev) =>
      prev.map((w) =>
        w.id === activeWallet.id ? { ...w, balanceBch: w.balanceBch + faucetAmount } : w
      )
    );
    setActiveWallet((w) => ({ ...w, balanceBch: w.balanceBch + faucetAmount }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Chipnet Faucet Mint',
      entity: 'stream',
      entityId: 'faucet',
      txid,
      amountSats: faucetAmount * 100000000,
      details: `Dispensed 5.0000 BCH from Chipnet sandbox faucet to ${activeWallet.name}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      '⚡ Faucet Dispensed',
      `Minted 5.0000 BCH into ${activeWallet.name.split(' ')[0]}'s testnet wallet.`,
      txid
    );
  };

  const handleClaimStream = (streamId: string, amountSats: number) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const newClaimed = s.claimedAmountSats + amountSats;
        const isDone = newClaimed >= s.totalAmountSats;
        return {
          ...s,
          claimedAmountSats: newClaimed,
          status: isDone ? 'completed' : s.status,
        };
      })
    );

    const bchAmount = amountSats / 100000000;
    setWallets((prev) =>
      prev.map((w) => (w.id === activeWallet.id ? { ...w, balanceBch: w.balanceBch + bchAmount } : w))
    );
    setActiveWallet((w) => ({ ...w, balanceBch: w.balanceBch + bchAmount }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Stream Claimed',
      entity: 'stream',
      entityId: streamId,
      txid,
      amountSats,
      details: `Recipient claimed ${formatBch(amountSats)} BCH through covenant verification.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      'Stream Claim Broadcasted',
      `Successfully claimed ${formatBch(amountSats)} BCH into your wallet.`,
      txid
    );
  };

  const handleCancelStream = (streamId: string) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setStreams((prev) =>
      prev.map((s) => (s.id === streamId ? { ...s, status: 'cancelled' } : s))
    );

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Stream Cancelled',
      entity: 'stream',
      entityId: streamId,
      txid,
      amountSats: 0,
      details: `Sender cancelled stream. Unstreamed balance refunded to sender address.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast('Stream Cancelled', 'Stream closed by sender covenant signature.', txid);
  };

  const handleRefundStream = (streamId: string) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setStreams((prev) =>
      prev.map((s) => (s.id === streamId ? { ...s, status: 'completed' } : s))
    );

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Stream Refunded',
      entity: 'stream',
      entityId: streamId,
      txid,
      amountSats: 0,
      details: `Post-deadline refund executed by sender via OP_CHECKLOCKTIMEVERIFY.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast('Stream Refund Executed', 'Expired stream deposit returned to sender.', txid);
  };

  const handleReleaseMilestone = (escrowId: string, milestoneId: number, amountSats: number) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setEscrows((prev) =>
      prev.map((e) => {
        if (e.id !== escrowId) return e;
        const updatedMilestones = e.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status: 'released' as const, releasedAt: now, txid } : m
        );
        const allDone = updatedMilestones.every((m) => m.status === 'released');
        return {
          ...e,
          milestones: updatedMilestones,
          currentMilestoneIndex: Math.min(e.milestones.length - 1, e.currentMilestoneIndex + 1),
          status: allDone ? 'completed' : e.status,
        };
      })
    );

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: `Milestone Released`,
      entity: 'escrow',
      entityId: escrowId,
      txid,
      amountSats,
      details: `Buyer unlocked milestone output for ${formatBch(amountSats)} BCH with covenant bytecode match.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      'Milestone Payment Released',
      `Sent ${formatBch(amountSats)} BCH to seller under covenant rules.`,
      txid
    );
  };

  const handleDisputeEscrow = (escrowId: string, sellerShareSats: number, buyerShareSats: number) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setEscrows((prev) =>
      prev.map((e) => (e.id === escrowId ? { ...e, status: 'disputed' } : e))
    );

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Arbiter Dispute Settled',
      entity: 'escrow',
      entityId: escrowId,
      txid,
      amountSats: sellerShareSats + buyerShareSats,
      details: `Arbiter resolved dispute: ${formatBch(sellerShareSats)} BCH to seller, ${formatBch(buyerShareSats)} BCH to buyer.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      'Dispute Resolved by Arbiter',
      `Partitioned vault funds to buyer and seller according to arbiter signature.`,
      txid
    );
  };

  const handleRefundEscrow = (escrowId: string) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);

    setEscrows((prev) =>
      prev.map((e) => (e.id === escrowId ? { ...e, status: 'refunded' } : e))
    );

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Escrow Timeout Refund',
      entity: 'escrow',
      entityId: escrowId,
      txid,
      amountSats: 0,
      details: `Buyer executed timeout refund after deadline elapsed.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast('Escrow Refunded', 'Timeout refund executed by buyer signature.', txid);
  };

  const handleCreateStream = (data: {
    title: string;
    recipientAddress: string;
    recipientName: string;
    totalAmountBch: number;
    durationHours: number;
    tokenSymbol: 'BCH' | 'PUSD';
  }) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);
    const stopTime = now + Math.floor(data.durationHours * 3600);
    const totalAmountSats = Math.floor(data.totalAmountBch * 100000000);

    const newStream: Stream = {
      id: `str-0${streams.length + 1}`,
      title: data.title,
      senderAddress: activeWallet.address,
      senderName: activeWallet.name,
      recipientAddress: data.recipientAddress,
      recipientName: data.recipientName,
      startTime: now,
      stopTime,
      totalAmountSats,
      claimedAmountSats: 0,
      status: 'active',
      tokenSymbol: data.tokenSymbol,
      covenantAddress: `bchtest:pv${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      txid,
    };

    setStreams((prev) => [newStream, ...prev]);

    setWallets((prev) =>
      prev.map((w) =>
        w.id === activeWallet.id ? { ...w, balanceBch: Math.max(0, w.balanceBch - data.totalAmountBch) } : w
      )
    );
    setActiveWallet((w) => ({ ...w, balanceBch: Math.max(0, w.balanceBch - data.totalAmountBch) }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Stream Created',
      entity: 'stream',
      entityId: newStream.id,
      txid,
      amountSats: totalAmountSats,
      details: `Initialized autonomous stream for ${data.totalAmountBch} ${data.tokenSymbol} over ${data.durationHours} hours.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      'New Stream Covenant Deployed',
      `Locked ${data.totalAmountBch} ${data.tokenSymbol} into BlazeStream covenant.`,
      txid
    );
  };

  const handleCreateEscrow = (data: {
    title: string;
    sellerAddress: string;
    sellerName: string;
    arbiterAddress: string;
    arbiterName: string;
    deadlineDays: number;
    milestones: { title: string; amountBch: number }[];
  }) => {
    const txid = generateTxid();
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + Math.floor(data.deadlineDays * 86400);
    const totalAmountSats = data.milestones.reduce(
      (sum, m) => sum + Math.floor(m.amountBch * 100000000),
      0
    );

    const newEscrow: Escrow = {
      id: `esc-0${escrows.length + 1}`,
      title: data.title,
      buyerAddress: activeWallet.address,
      buyerName: activeWallet.name,
      sellerAddress: data.sellerAddress,
      sellerName: data.sellerName,
      arbiterAddress: data.arbiterAddress,
      arbiterName: data.arbiterName,
      deadline,
      totalAmountSats,
      currentMilestoneIndex: 0,
      status: 'active',
      covenantAddress: `bchtest:pw${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      txid,
      milestones: data.milestones.map((m, idx) => ({
        id: idx + 1,
        title: m.title,
        amountSats: Math.floor(m.amountBch * 100000000),
        status: 'pending',
      })),
    };

    setEscrows((prev) => [newEscrow, ...prev]);

    const totalBch = totalAmountSats / 100000000;
    setWallets((prev) =>
      prev.map((w) =>
        w.id === activeWallet.id ? { ...w, balanceBch: Math.max(0, w.balanceBch - totalBch) } : w
      )
    );
    setActiveWallet((w) => ({ ...w, balanceBch: Math.max(0, w.balanceBch - totalBch) }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'Escrow Vault Deployed',
      entity: 'escrow',
      entityId: newEscrow.id,
      txid,
      amountSats: totalAmountSats,
      details: `Initialized 3-milestone escrow vault for ${totalBch} BCH with arbiter protection.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    addToast(
      'Milestone Escrow Vault Deployed',
      `Locked ${totalBch} BCH across 3 milestones on Bitcoin Cash Chipnet.`,
      txid
    );
  };

  return (
    <div className="app-shell flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallets={wallets}
        activeWallet={activeWallet}
        setActiveWallet={setActiveWallet}
        blockHeight={blockHeight}
        onClaimFaucet={handleClaimFaucet}
      />

      <main className="app-main">
        <div className="demo-notice" role="note"><strong>DEMO MODE</strong><span>Balances and actions are simulated in this browser session. No blockchain transaction is sent.</span></div>
        {activeTab === 'streams' && (
          <StreamView
            streams={streams}
            activeWallet={activeWallet}
            onOpenCreateModal={() => setIsCreateStreamOpen(true)}
            onClaim={handleClaimStream}
            onCancel={handleCancelStream}
            onRefund={handleRefundStream}
          />
        )}

        {activeTab === 'escrows' && (
          <EscrowView
            escrows={escrows}
            activeWallet={activeWallet}
            onOpenCreateModal={() => setIsCreateEscrowOpen(true)}
            onReleaseMilestone={handleReleaseMilestone}
            onDispute={handleDisputeEscrow}
            onRefund={handleRefundEscrow}
          />
        )}

        {activeTab === 'inspector' && <CovenantInspector auditLogs={auditLogs} />}
      </main>

      <footer className="app-footer w-full py-6 text-center text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>BlazeVault Protocol</span> • <span>Bitcoin Cash Introspection Covenants</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-emerald-400 font-medium">BCH BLAZE 2026</span>
            <span>•</span>
            <a
              href="https://chipnet.imaginary.cash/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Chipnet Explorer ↗
            </a>
          </div>
        </div>
      </footer>

      <CreateStreamModal
        isOpen={isCreateStreamOpen}
        onClose={() => setIsCreateStreamOpen(false)}
        activeWallet={activeWallet}
        onCreateStream={handleCreateStream}
      />

      <CreateEscrowModal
        isOpen={isCreateEscrowOpen}
        onClose={() => setIsCreateEscrowOpen(false)}
        activeWallet={activeWallet}
        onCreateEscrow={handleCreateEscrow}
      />

      <NotificationToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

export default App;
