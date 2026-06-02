import { randomUUID } from 'crypto';
import type { TimingEntry } from './timer.types';
import { TIMINGS_MAX_ENTRIES } from '../../shared/constants/limits';

const timingLog: TimingEntry[] = [];

export function pushTiming(
  entry: Omit<TimingEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): void {
  timingLog.push({
    id: entry.id ?? randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    route: entry.route,
    method: entry.method,
    durationMs: entry.durationMs,
    statusCode: entry.statusCode,
    label: entry.label,
  });
  while (timingLog.length > TIMINGS_MAX_ENTRIES) {
    timingLog.shift();
  }
}

export function getTimings(): TimingEntry[] {
  return [...timingLog];
}

export function clearTimings(): void {
  timingLog.length = 0;
}

