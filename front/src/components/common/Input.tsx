import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps): React.ReactElement {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'input--error' : ''} ${className ?? ''}`.trim()}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  className,
  id,
  ...props
}: TextAreaProps): React.ReactElement {
  const inputId = id ?? (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`textarea ${error ? 'textarea--error' : ''} ${className ?? ''}`.trim()}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
