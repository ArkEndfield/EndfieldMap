import 'swiper/swiper.css';
import './index.css';

import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { ChevronUp, ChevronUpTriangle } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const ZmdSwiper = observer(() => {
  const expanded = uiManager.swiperOpen.value;
  const isMobile = useIsMobile();
  const { mapDataService } = useAdapter();
  const swiperRef = useRef<SwiperType>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperConfig = mapDataService.swiperDataService.swiperConfig;

  if (!swiperConfig.enable || swiperConfig.list.length === 0) {
    return null;
  }

  // 切换时更新激活索引
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  // 分页条点击 - 使用事件委托
  const handlePaginationClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const index = (e.target as HTMLElement).dataset.index;
    if (index !== undefined) {
      swiperRef.current?.slideToLoop(Number(index));
    }
  }, []);

  // 导航按钮
  const handlePrev = useCallback(() => swiperRef.current?.slidePrev(), []);
  const handleNext = useCallback(() => swiperRef.current?.slideNext(), []);

  // 缓存幻灯片渲染
  const slides = useMemo(
    () =>
      swiperConfig.list.map((data, index) => (
        <SwiperSlide key={`${data.cover}-${index}`} className="flex items-center justify-center overflow-hidden">
          <a href={data.link} target="_blank" rel="noopener noreferrer">
            <img src={data.cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          </a>
        </SwiperSlide>
      )),
    [swiperConfig.list]
  );

  return (
    <div className="fixed right-0 h-28 md:h-36 bottom-11 md:bottom-12">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0, paddingRight: 0 }}
            animate={{
              width: isMobile ? '12rem' : '16rem',
              opacity: 1,
              paddingRight: '1rem',
              transition: { duration: 0.3, ease: 'easeOut' },
            }}
            exit={{ width: 0, opacity: 0, paddingRight: 0, transition: { duration: 0.2 } }}
            className="relative ml-auto flex flex-col h-full"
          >
            <div className="flex-1 overflow-hidden">
              <Swiper
                spaceBetween={30}
                modules={[Autoplay]}
                loop
                onSwiper={(instance) => {
                  swiperRef.current = instance;
                }}
                onSlideChange={handleSlideChange}
                autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                className="h-full bg-[#1F1F20] shadow-lg text-white border border-[#ffffff] zmd-swiper-custom"
              >
                {slides}
                <div className="absolute right-2 bottom-2 z-1 flex items-center gap-4 bg-black/60 rounded-full p-0.5">
                  <ZmdRoundIconButton onClick={handlePrev}>
                    <ChevronUp className="rotate-270 text-xs -ml-0.5" />
                  </ZmdRoundIconButton>
                  <ZmdRoundIconButton onClick={handleNext}>
                    <ChevronUp className="rotate-90 text-xs -mr-0.5" />
                  </ZmdRoundIconButton>
                </div>
              </Swiper>
            </div>
            {/* 自定义分页条 - 使用事件委托 */}
            <div className="flex gap-0.5 mt-0.5" onClick={handlePaginationClick}>
              {swiperConfig.list.map((_, index) => (
                <div
                  key={index}
                  data-index={index}
                  className={cn('flex-1 h-0.5 md:h-1 cursor-pointer', index === activeIndex ? 'bg-[#dfd54a]' : 'bg-[#818182]')}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 收缩/展开按钮 */}
      <ZmdRoundIconButton
        className="absolute right-full mr-1 top-1/2 -translate-y-1/2 z-1 w-4 h-12"
        onClick={() => (uiManager.swiperOpen.value = !uiManager.swiperOpen.value)}
      >
        <ChevronUpTriangle className={cn('transition-transform text-xs', expanded ? 'rotate-90' : 'rotate-270')} />
      </ZmdRoundIconButton>
    </div>
  );
});

export default ZmdSwiper;
