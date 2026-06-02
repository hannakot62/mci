import React, { useCallback, useEffect, useState } from 'react';
import { clearMetrics, getMetrics, type TimingEntry } from '../api/client';

function rowClass(durationMs: number): string {
  if (durationMs < 50) return 'timing-fast';
  if (durationMs < 200) return 'timing-medium';
  return 'timing-slow';
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function TimingLog(): React.ReactElement {
  const [entries, setEntries] = useState<TimingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const avg =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.durationMs, 0) / entries.length)
      : 0;

  const handleClear = async (): Promise<void> => {
    await clearMetrics();
    await refresh();
  };

  return (
    <footer className="timing-log">
      <div className="timing-log-header">
        <strong>Timing Log</strong>
        <span>
          {entries.length} ops · avg {avg} ms
        </span>
        <button type="button" onClick={() => void handleClear()}>
          Clear
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="timing-log-body">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Label / Route</th>
              <th>Duration (ms)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((entry) => (
              <tr key={entry.id} className={rowClass(entry.durationMs)}>
                <td>{formatTime(entry.timestamp)}</td>
                <td>{entry.label ?? `${entry.method} ${entry.route}`}</td>
                <td>{entry.durationMs}</td>
                <td>{entry.statusCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </footer>
  );
}
