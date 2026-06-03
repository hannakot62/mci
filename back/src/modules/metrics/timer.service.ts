import { pushTiming } from './timer.store';

/** Timing log label for MCI candidate search (shown in caps in the UI). */
export const TIMING_LABEL_FIND_MCI = 'FIND MCI';

export async function recordTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    pushTiming({
      route: label,
      method: 'INTERNAL',
      durationMs: Math.round(performance.now() - start),
      statusCode: 200,
      label,
    });
  }
}

export function recordTimingSync<T>(label: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    pushTiming({
      route: label,
      method: 'INTERNAL',
      durationMs: Math.round(performance.now() - start),
      statusCode: 200,
      label,
    });
  }
}

