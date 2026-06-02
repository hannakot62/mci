import { useCallback, useEffect, useState } from 'react';
import { getMetrics, type TimingEntry } from '@/api/client';

export function useTimingLog() {
  const [entries, setEntries] = useState<TimingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clearedAfter, setClearedAfter] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getMetrics();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const clear = useCallback((): void => {
    setClearedAfter(new Date().toISOString());
    setEntries([]);
    setError(null);
  }, []);

  return { entries, error, clearedAfter, clear };
}
