import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrollFadeEdges = {
  top: boolean;
  bottom: boolean;
};

const HIDDEN_EDGES: ScrollFadeEdges = { top: false, bottom: false };

export function useScrollFadeEdges(contentKey?: string) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<ScrollFadeEdges>(HIDDEN_EDGES);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setEdges(HIDDEN_EDGES);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight > clientHeight + 1;

    setEdges({
      top: canScroll && scrollTop > 1,
      bottom: canScroll && scrollTop + clientHeight < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateEdges();

    const observer = new ResizeObserver(() => updateEdges());
    observer.observe(el);

    const mutationObserver = new MutationObserver(() => updateEdges());
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateEdges, contentKey]);

  return { scrollRef, edges, updateEdges };
}
