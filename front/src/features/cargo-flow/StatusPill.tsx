import React from 'react';

interface StatusPillProps {
  status: string;
  color: string;
}

export function StatusPill({ status, color }: StatusPillProps): React.ReactElement {
  return (
    <span className="cargo-node__status" style={{ backgroundColor: color }}>
      {status.replace('_', ' ')}
    </span>
  );
}
