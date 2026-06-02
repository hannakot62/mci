import React from 'react';
import { formatButtonChildren } from '@/utils/formatButtonChildren';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className ?? ''}`.trim()}
      {...props}
    >
      {formatButtonChildren(children)}
    </button>
  );
}
