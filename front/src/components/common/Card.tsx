import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps): React.ReactElement {
  return <div className={`card ${className ?? ''}`.trim()}>{children}</div>;
}
