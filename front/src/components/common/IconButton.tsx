import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}

export function IconButton({
  label,
  variant = 'default',
  className,
  children,
  ...props
}: IconButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${variant} ${className ?? ''}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
