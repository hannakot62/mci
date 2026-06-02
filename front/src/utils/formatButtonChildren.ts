import React from 'react';
import { toButtonLabel } from './titleCase';

export function formatButtonChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    return toButtonLabel(children);
  }
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === 'string' ? toButtonLabel(child) : child));
  }
  return children;
}
