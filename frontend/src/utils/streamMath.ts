import type { Stream } from '../types';

export function streamSnapshot(stream: Stream, now: number) {
  const duration = Math.max(1, stream.stopTime - stream.startTime);
  const elapsed = Math.max(0, Math.min(duration, now - stream.startTime));
  const streamedSats = stream.status === 'completed'
    ? stream.totalAmountSats
    : stream.status === 'cancelled'
      ? stream.claimedAmountSats
      : Math.floor((elapsed / duration) * stream.totalAmountSats);
  return {
    streamedSats,
    claimableSats: Math.max(0, streamedSats - stream.claimedAmountSats),
    progress: stream.totalAmountSats > 0 ? Math.min(100, Math.max(0, streamedSats / stream.totalAmountSats * 100)) : 0,
    satsPerSecond: Math.round(stream.totalAmountSats / duration),
    hasEnded: now >= stream.stopTime,
  };
}
