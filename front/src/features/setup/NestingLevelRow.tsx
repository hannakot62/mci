import React from 'react';
import { IconButton, RangeInput, TrashIcon } from '@/components/common';
import { SETUP_MAX_NESTING_CHILD_COUNT } from './setup.limits';

interface NestingLevelRowProps {
  levelIndex: number;
  childCount: number;
  onChange: (childCount: number) => void;
  onRemove: () => void;
}

export function NestingLevelRow({
  levelIndex,
  childCount,
  onChange,
  onRemove,
}: NestingLevelRowProps): React.ReactElement {
  return (
    <div className="nesting-row">
      <RangeInput
        label={`Level ${levelIndex + 1}`}
        min={0}
        max={SETUP_MAX_NESTING_CHILD_COUNT}
        value={childCount}
        onChange={onChange}
      />
      <IconButton label="Remove nesting level" variant="danger" onClick={onRemove}>
        <TrashIcon />
      </IconButton>
    </div>
  );
}
