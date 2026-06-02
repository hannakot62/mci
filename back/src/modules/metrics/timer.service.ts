import { pushTiming } from './timer.store';

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

