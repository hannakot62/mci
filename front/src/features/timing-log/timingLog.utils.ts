import type { TimingEntry } from '@/api/client';

export function rowClass(durationMs: number): string {
  if (durationMs < 50) return 'timing-fast';
  if (durationMs < 200) return 'timing-medium';
  return 'timing-slow';
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function filterVisibleEntries(
  entries: TimingEntry[],
  clearedAfter: string | null
): TimingEntry[] {
  return entries.filter((e) => {
    if (e.route === '/api/metrics') return false;
    if (!clearedAfter) return true;
    return e.timestamp > clearedAfter;
  });
}

export function averageDuration(entries: TimingEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((sum, e) => sum + e.durationMs, 0) / entries.length);
}
