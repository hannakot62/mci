import React from 'react';
import { IconButton, RangeInput, TrashIcon } from '@/components/common';

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
        max={5}
        value={childCount}
        onChange={onChange}
      />
      <IconButton label="Remove nesting level" variant="danger" onClick={onRemove}>
        <TrashIcon />
      </IconButton>
    </div>
  );
}
