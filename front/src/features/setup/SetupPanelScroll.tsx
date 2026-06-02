import React from 'react';
import { useScrollFadeEdges } from '@/hooks/useScrollFadeEdges';

interface SetupPanelScrollProps {
  watchKey: string;
  children: React.ReactNode;
}

export function SetupPanelScroll({
  watchKey,
  children,
}: SetupPanelScrollProps): React.ReactElement {
  const { scrollRef, edges, updateEdges } = useScrollFadeEdges(watchKey);

  return (
    <div className="setup-panel__scroll-wrap">
      <span
        className={`setup-panel__fade setup-panel__fade--top${
          edges.top ? ' setup-panel__fade--active' : ''
        }`}
        aria-hidden
      />
      <div ref={scrollRef} className="setup-panel__body" onScroll={updateEdges}>
        {children}
      </div>
      <span
        className={`setup-panel__fade setup-panel__fade--bottom${
          edges.bottom ? ' setup-panel__fade--active' : ''
        }`}
        aria-hidden
      />
    </div>
  );
}
