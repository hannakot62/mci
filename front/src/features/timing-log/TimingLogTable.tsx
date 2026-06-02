import React from 'react';
import type { TimingEntry } from '@/api/client';
import { formatTime, rowClass } from './timingLog.utils';

interface TimingLogTableProps {
  entries: TimingEntry[];
}

export function TimingLogTable({ entries }: TimingLogTableProps): React.ReactElement {
  return (
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
  );
}
