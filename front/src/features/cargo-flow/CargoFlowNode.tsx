import React, { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatusPill } from './StatusPill';
import type { CargoNodeData } from './cargoNode.types';

const HANDLE_STYLE = { opacity: 0, width: 6, height: 6 };

function CargoFlowNodeComponent({ data }: NodeProps): React.ReactElement {
  const d = data as CargoNodeData;
  const showTopHandle = d.kind !== 'transport';
  const showBottomHandle =
    d.kind !== 'goods' && d.kind !== 'goods-summary' && d.kind !== 'packaging-summary';

  const mciStyle: CSSProperties | undefined =
    d.isMci && d.mciAccent
      ? ({
          '--mci-accent': d.mciAccent,
          '--mci-soft': d.mciSoft,
          '--mci-status': d.mciStatusColor ?? d.statusColor,
        } as CSSProperties)
      : undefined;

  const mciClass =
    d.isMci && d.status
      ? ` cargo-node--mci-status-${d.status.replace(/[^a-z0-9_-]/gi, '_')}`
      : '';

  return (
    <div
      className={`cargo-node cargo-node--${d.kind}${d.isMci ? ` cargo-node--mci${mciClass}` : ''}`}
      style={mciStyle}
    >
      {showTopHandle && (
        <Handle type="target" position={Position.Top} style={HANDLE_STYLE} isConnectable={false} />
      )}

      {d.isMci && d.mciAccent && (
        <span className="cargo-node__mci-rail" style={{ backgroundColor: d.mciAccent }} />
      )}

      <div className="cargo-node__header">
        <span className="cargo-node__title">{d.title}</span>
        {d.isMci && d.mciProductSku && (
          <span
            className="cargo-node__product"
            style={{ color: d.mciAccent, borderColor: d.mciAccent }}
          >
            {d.mciProductSku}
          </span>
        )}
        {d.isMci && (
          <span className="cargo-node__mci-tag">
            {d.kind === 'goods' ? 'MCI·goods' : 'MCI'}
          </span>
        )}
        {d.status && d.statusColor && (
          <StatusPill
            status={d.status}
            color={d.isMci ? (d.mciStatusColor ?? d.statusColor) : d.statusColor}
          />
        )}
      </div>

      {d.subtitle && <div className="cargo-node__subtitle">{d.subtitle}</div>}
      {d.route && <div className="cargo-node__route">{d.route}</div>}

      {showBottomHandle && (
        <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} isConnectable={false} />
      )}
    </div>
  );
}

export const CargoFlowNode = memo(CargoFlowNodeComponent);
