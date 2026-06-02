import React, { useId } from 'react';

interface RangeInputProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function RangeInput({
  label,
  min,
  max,
  value,
  onChange,
  disabled,
  className,
}: RangeInputProps): React.ReactElement {
  const id = useId();
  const range = max - min;
  const percent = range === 0 ? 0 : ((value - min) / range) * 100;

  return (
    <div className={`range-input ${className ?? ''}`.trim()}>
      <div className="range-input__header">
        <label className="range-input__label" htmlFor={id}>
          {label}
        </label>
        <span className="range-input__value">{value}</span>
      </div>
      <div className="range-input__track-wrap">
        <span className="range-input__track" aria-hidden />
        <span className="range-input__fill" style={{ width: `${percent}%` }} aria-hidden />
        <input
          id={id}
          className="range-input__native"
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
