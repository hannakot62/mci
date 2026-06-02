import React from 'react';

interface FieldLabelProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FieldLabel({ label, htmlFor, children }: FieldLabelProps): React.ReactElement {
  return (
    <label htmlFor={htmlFor}>
      {label}
      {children}
    </label>
  );
}
