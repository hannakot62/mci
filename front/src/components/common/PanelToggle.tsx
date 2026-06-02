import React from 'react';
import { ChevronIcon } from './icons/ChevronIcon';

interface PanelToggleProps {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  edge?: 'setup' | 'timing';
}

export function PanelToggle({
  expanded,
  onToggle,
  label,
  edge = 'setup',
}: PanelToggleProps): React.ReactElement {
  const direction =
    edge === 'setup' ? (expanded ? 'left' : 'right') : expanded ? 'down' : 'up';

  const edgeClass = edge === 'setup' ? 'panel-toggle--edge' : '';

  return (
    <button
      type="button"
      className={`panel-toggle ${edgeClass} panel-toggle--${edge}`.trim()}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={label}
      title={label}
    >
      <ChevronIcon direction={direction} />
    </button>
  );
}
