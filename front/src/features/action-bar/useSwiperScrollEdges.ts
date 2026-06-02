import { useCallback, useState } from 'react';
import type { Swiper as SwiperInstance } from 'swiper';

export type SwiperScrollEdges = {
  left: boolean;
  right: boolean;
};

const HIDDEN_EDGES: SwiperScrollEdges = { left: false, right: false };

export function useSwiperScrollEdges() {
  const [edges, setEdges] = useState<SwiperScrollEdges>(HIDDEN_EDGES);

  const updateEdges = useCallback((swiper: SwiperInstance) => {
    if (swiper.isLocked || swiper.slides.length === 0) {
      setEdges(HIDDEN_EDGES);
      return;
    }

    setEdges({
      left: !swiper.isBeginning,
      right: !swiper.isEnd,
    });
  }, []);

  const onSwiper = useCallback(
    (swiper: SwiperInstance) => {
      updateEdges(swiper);
    },
    [updateEdges]
  );

  return { edges, onSwiper, updateEdges };
}
