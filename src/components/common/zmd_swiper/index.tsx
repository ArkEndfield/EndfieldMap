import 'swiper/swiper.css';
import './index.css';

import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { ChevronUp, ChevronUpTriangle } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const ZmdSwiper = observer(() => {
  const expanded = uiManager.swiperOpen.value;
  const { dataService } = useAdapter();
  const swiperRef = useRef<SwiperType>(null);
  const paginationContainerRef = useRef<HTMLDivElement>(null);
  const swiperConfig = dataService.swiperDataService.swiperConfig;

  const updatePaginationProgress = useCallback((swiper: SwiperType, progress: number) => {
    if (!paginationContainerRef.current) return;
    const activeIndex = swiper.realIndex;
    const bullets = paginationContainerRef.current.children;

    // 更新所有分页条
    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i] as HTMLElement;
      if (i < activeIndex) {
        // 当前索引之前的分页条，填充满（100%）
        bullet.classList.remove('active');
        bullet.style.setProperty('--progress', '1');
      } else if (i === activeIndex) {
        // 当前激活的分页条，显示进度
        bullet.classList.add('active');
        bullet.style.setProperty('--progress', String(1 - progress));
      } else {
        // 当前索引之后的分页条，保持空（0%）
        bullet.classList.remove('active');
        bullet.style.setProperty('--progress', '0');
      }
    }
  }, []);

  const onAutoplayTimeLeft = useCallback(
    (swiper: SwiperType, _time: number, progress: number) => {
      if (swiperConfig.list.length <= 1) return;
      // 更新分页条进度
      updatePaginationProgress(swiper, progress);
    },
    [swiperConfig.list.length, updatePaginationProgress]
  );

  if (!swiperConfig.enable || swiperConfig.list.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-0 h-36 bottom-18 md:bottom-12">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0, paddingRight: 0 }}
            animate={{
              width: '16rem',
              opacity: 1,
              paddingRight: '1rem',
              transition: { duration: 0.5, type: 'spring', bounce: 0.25 },
            }}
            exit={{ width: 0, opacity: 0, paddingRight: 0, transition: { duration: 0.3 } }}
            className="relative ml-auto flex flex-col h-full"
          >
            <div className="flex-1 overflow-hidden">
              <Swiper
                spaceBetween={30}
                modules={[Autoplay, Navigation]}
                loop
                onSwiper={(instance) => {
                  swiperRef.current = instance;
                  // 初始化第一个分页条为激活状态
                  if (paginationContainerRef.current?.children[0]) {
                    (paginationContainerRef.current.children[0] as HTMLElement).classList.add('active');
                  }
                }}
                onSlideChange={(swiper) => {
                  const activeIndex = swiper.realIndex;
                  // 如果是循环回到第一张（索引0），重置所有分页条
                  if (activeIndex === 0 && paginationContainerRef.current) {
                    const bullets = paginationContainerRef.current.children;
                    for (let i = 0; i < bullets.length; i++) {
                      (bullets[i] as HTMLElement).style.setProperty('--progress', '0');
                    }
                  }
                  // 切换幻灯片时更新分页条，初始进度设为0（即填充为100%，因为是1-progress）
                  updatePaginationProgress(swiper, 0);
                }}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                onAutoplayTimeLeft={onAutoplayTimeLeft}
                className="h-full bg-[#1F1F20] shadow-lg text-white border border-[#ffffff] zmd-swiper-custom"
              >
                {swiperConfig.list.map((data, index) => (
                  <SwiperSlide
                    key={`${data.cover}-${index}`}
                    className="flex items-center justify-center text-2xl font-bold overflow-hidden"
                  >
                    <a href={data.link} target="_blank" rel="noopener noreferrer">
                      <img
                        src={data.cover}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </SwiperSlide>
                ))}

                <div className="absolute right-2 bottom-2 z-1 flex items-center gap-4 bg-black/60 rounded-full p-0.5">
                  <ZmdRoundIconButton onClick={() => swiperRef.current?.slidePrev()}>
                    <ChevronUp className="rotate-270 text-xs -ml-0.5" />
                  </ZmdRoundIconButton>
                  <ZmdRoundIconButton onClick={() => swiperRef.current?.slideNext()}>
                    <ChevronUp className="rotate-90 text-xs -mr-0.5" />
                  </ZmdRoundIconButton>
                </div>
              </Swiper>
            </div>
            {/* 自定义分页条 */}
            <div className="flex gap-0.5 mt-0.5 zmd-pagination-container" ref={paginationContainerRef}>
              {swiperConfig.list.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-[#818182] relative overflow-hidden cursor-pointer"
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  data-index={index}
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
