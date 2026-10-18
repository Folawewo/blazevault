export interface Stream {
  id: string;
  title: string;
  senderAddress: string;
  senderName: string;
  recipientAddress: string;
  recipientName: string;
  startTime: number;
  stopTime: number;
  totalAmountSats: number;
  claimedAmountSats: number;
  status: 'active' | 'completed' | 'cancelled';
  tokenSymbol: 'BCH' | 'PUSD';
  covenantAddress: string;
  txid: string;
}

export interface Milestone {
  id: number;
  title: string;
  amountSats: number;
  status: 'pending' | 'released' | 'disputed';
  releasedAt?: number;
  txid?: string;
}

export interface Escrow {
  id: string;
  title: string;
  buyerAddress: string;
  buyerName: string;
  sellerAddress: string;
  sellerName: string;
  arbiterAddress: string;
  arbiterName: string;
  deadline: number;
  totalAmountSats: number;
  milestones: Milestone[];
  currentMilestoneIndex: number;
  status: 'active' | 'completed' | 'disputed' | 'refunded';
  covenantAddress: string;
  txid: string;
}

export interface WalletProfile {
  id: string;
  name: string;
  role: 'Buyer / Creator' | 'Seller / Developer' | 'Arbiter / Escrow Guardian';
  address: string;
  pkh: string;
  balanceBch: number;
  balancePusd: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  entity: 'stream' | 'escrow';
  entityId: string;
  txid: string;
  amountSats: number;
  details: string;
}
