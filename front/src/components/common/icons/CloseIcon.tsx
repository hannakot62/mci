import React from 'react';
import { Icon } from '../Icon';

export function CloseIcon(): React.ReactElement {
  return (
    <Icon viewBox="0 0 24 24" size={14} aria-hidden>
      <path
        fill="currentColor"
        d="M6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6 5.6-5.6L17.6 5 12 10.6 6.4 5z"
      />
    </Icon>
  );
}
