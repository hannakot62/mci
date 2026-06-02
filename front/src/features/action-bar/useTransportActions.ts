import { useCallback, useState } from 'react';
import { deliver, dispatch } from '@/api/client';

export function useTransportActions(transportId: string, onUpdated: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async (action: 'dispatch' | 'deliver'): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        if (action === 'dispatch') {
          await dispatch(transportId);
        } else {
          await deliver(transportId);
        }
        onUpdated();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setLoading(false);
      }
    },
    [onUpdated, transportId]
  );

  return { loading, error, runAction };
}
