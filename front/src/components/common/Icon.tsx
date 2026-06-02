import React from 'react';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  children: React.ReactNode;
}

export function Icon({
  size = 16,
  className,
  children,
  ...props
}: IconProps): React.ReactElement {
  return (
    <svg
      className={`icon ${className ?? ''}`.trim()}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}
