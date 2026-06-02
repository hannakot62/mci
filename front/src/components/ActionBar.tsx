import React, { useState } from 'react';
import { deliver, dispatch, type TransportDetail } from '../api/client';

interface ActionBarProps {
  transport: TransportDetail | null;
  onUpdated: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#9ca3af',
  loading: '#3b82f6',
  in_transit: '#f59e0b',
  delivered: '#22c55e',
  idle: '#6b7280',
};

export function ActionBar({ transport, onUpdated }: ActionBarProps): React.ReactElement | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transport) return null;

  const runAction = async (action: 'dispatch' | 'deliver'): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (action === 'dispatch') {
        await dispatch(transport.id);
      } else {
        await deliver(transport.id);
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const from = transport.departureLocation.code;
  const to = transport.arrivalLocation.code;

  return (
    <div className="action-bar">
      <span
        className="status-badge large"
        style={{ backgroundColor: STATUS_COLORS[transport.status] ?? '#6b7280' }}
      >
        {transport.status}
      </span>
      <button
        type="button"
        disabled={loading || transport.status === 'delivered'}
        onClick={() => void runAction('dispatch')}
      >
        Dispatch {from}→{to}
      </button>
      <button
        type="button"
        disabled={loading || transport.status === 'delivered'}
        onClick={() => void runAction('deliver')}
      >
        Mark Delivered
      </button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
