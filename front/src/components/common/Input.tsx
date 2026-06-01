import React from 'react';
import '../components.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps): React.ReactElement {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input className={`input ${error ? 'input--error' : ''} ${className || ''}`} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, ...props }: TextAreaProps): React.ReactElement {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <textarea
        className={`textarea ${error ? 'textarea--error' : ''} ${className || ''}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}