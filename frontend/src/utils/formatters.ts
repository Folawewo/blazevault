export function formatBch(satoshis: number): string {
  const bch = satoshis / 100000000;
  return bch.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  });
}

export function formatUsd(satoshis: number, bchPriceUsd: number = 320): string {
  const bch = satoshis / 100000000;
  const usd = bch * bchPriceUsd;
  return usd.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function truncateAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 8) return address;
  const parts = address.split(':');
  const prefix = parts.length > 1 ? parts[0] + ':' : '';
  const body = parts.length > 1 ? parts[1] : address;
  return `${prefix}${body.slice(0, chars)}...${body.slice(-chars)}`;
}

export function truncateTxid(txid: string): string {
  if (!txid) return '';
  if (txid.length <= 16) return txid;
  return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}
