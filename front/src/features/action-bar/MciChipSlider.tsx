import React from 'react';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { MciChipData } from './actionBar.types';
import { MciChip } from './MciChip';
import { useSwiperScrollEdges } from './useSwiperScrollEdges';

interface MciChipSliderProps {
  chips: MciChipData[];
}

export function MciChipSlider({ chips }: MciChipSliderProps): React.ReactElement {
  const { edges, onSwiper, updateEdges } = useSwiperScrollEdges();

  return (
    <div className="action-bar__slider-wrap">
      <span className="action-bar__slider-label">MCI</span>
      <div className="action-bar__swiper-wrap">
        <span
          className={`action-bar__swiper-fade action-bar__swiper-fade--left${
            edges.left ? ' action-bar__swiper-fade--active' : ''
          }`}
          aria-hidden
        />
        <Swiper
          className="action-bar__swiper"
          modules={[FreeMode]}
          spaceBetween={8}
          slidesPerView="auto"
          freeMode={{ enabled: true, sticky: false }}
          watchOverflow
          grabCursor
          observer
          observeParents
          aria-label="MCI units"
          onSwiper={onSwiper}
          onSlideChange={updateEdges}
          onReachBeginning={updateEdges}
          onReachEnd={updateEdges}
          onFromEdge={updateEdges}
          onResize={updateEdges}
          onSetTranslate={updateEdges}
          onTransitionEnd={updateEdges}
        >
          {chips.map((mci) => (
            <SwiperSlide key={mci.id} className="action-bar__slide">
              <MciChip mci={mci} />
            </SwiperSlide>
          ))}
        </Swiper>
        <span
          className={`action-bar__swiper-fade action-bar__swiper-fade--right${
            edges.right ? ' action-bar__swiper-fade--active' : ''
          }`}
          aria-hidden
        />
      </div>
    </div>
  );
}
