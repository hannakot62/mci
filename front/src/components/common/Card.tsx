import React from 'react';
import '../components.scss';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps): React.ReactElement {
  return <div className={`card ${className || ''}`}>{children}</div>;
}
