import React from 'react';
import { Icon } from '../Icon';

type ChevronDirection = 'left' | 'right' | 'up' | 'down';

const ROTATION: Record<ChevronDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

interface ChevronIconProps {
  direction?: ChevronDirection;
}

export function ChevronIcon({ direction = 'right' }: ChevronIconProps): React.ReactElement {
  return (
    <Icon
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
    >
      <path
        fill="currentColor"
        d="M9.29 6.71a1 1 0 0 1 1.42 0L15.59 12l-4.88 5.29a1 1 0 0 1-1.42-1.42L12.17 12 9.29 9.13a1 1 0 0 1 0-1.42z"
      />
    </Icon>
  );
}
