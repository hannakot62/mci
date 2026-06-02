import React from 'react';
import { FieldLabel } from '@/components/common';
import type { TransportType } from './setup.types';

interface TransportFieldsProps {
  transportCode: string;
  transportType: TransportType;
  onCodeChange: (code: string) => void;
  onTypeChange: (type: TransportType) => void;
}

export function TransportFields({
  transportCode,
  transportType,
  onCodeChange,
  onTypeChange,
}: TransportFieldsProps): React.ReactElement {
  return (
    <>
      <FieldLabel label="Transport code">
        <input
          value={transportCode}
          onChange={(e) => onCodeChange(e.target.value)}
          required
        />
      </FieldLabel>

      <FieldLabel label="Transport type">
        <select
          value={transportType}
          onChange={(e) => onTypeChange(e.target.value as TransportType)}
        >
          <option value="truck">Truck</option>
          <option value="container">Container</option>
          <option value="van">Van</option>
        </select>
      </FieldLabel>
    </>
  );
}
