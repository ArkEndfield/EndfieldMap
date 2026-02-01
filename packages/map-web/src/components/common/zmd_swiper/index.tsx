import 'swiper/swiper.css';
import './index.css';

import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
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
  const paginationContainerRef = useRef<HTMLDivElement>(null);
  const bulletRefs = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef({ index: -1, progress: -1 });
  const swiperConfig = mapDataService.swiperDataService.swiperConfig;

  // 使用 requestAnimationFrame 节流高频更新
  const scheduleProgressUpdate = useCallback((swiper: SwiperType, progress: number) => {
    if (rafRef.current !== null) {
      return;
    }

    const activeIndex = swiper.realIndex;
    const lastUpdate = lastUpdateRef.current;

    // 如果索引和进度都没变化，跳过更新
    if (lastUpdate.index === activeIndex && Math.abs(lastUpdate.progress - progress) < 0.001) {
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!paginationContainerRef.current) return;

      const bullets = bulletRefs.current;
      const activeBullet = bullets[activeIndex];

      // 只更新当前激活的分页条，减少 DOM 操作
      if (activeBullet) {
        activeBullet.classList.add('active');
        activeBullet.style.setProperty('--progress', String(1 - progress));
      }

      // 仅在索引变化时更新其他分页条
      if (lastUpdate.index !== activeIndex) {
        bullets.forEach((bullet, i) => {
          if (i < activeIndex) {
            bullet.classList.remove('active');
            bullet.style.setProperty('--progress', '1');
          } else if (i > activeIndex) {
            bullet.classList.remove('active');
            bullet.style.setProperty('--progress', '0');
          }
        });
      }

      lastUpdateRef.current = { index: activeIndex, progress };
      rafRef.current = null;
    });
  }, []);

  const onAutoplayTimeLeft = useCallback(
    (swiper: SwiperType, _time: number, progress: number) => {
      if (swiperConfig.list.length <= 1 || !expanded) return;
      scheduleProgressUpdate(swiper, progress);
    },
    [swiperConfig.list.length, expanded, scheduleProgressUpdate]
  );

  // 缓存分页条引用
  useEffect(() => {
    if (paginationContainerRef.current) {
      bulletRefs.current = Array.from(paginationContainerRef.current.children) as HTMLElement[];
    }
  }, [swiperConfig.list.length]);

  if (!swiperConfig.enable || swiperConfig.list.length === 0) {
    return null;
  }

  // 手动切换时立即更新分页
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const activeIndex = swiper.realIndex;
    const bullets = bulletRefs.current;

    // 重置所有分页条
    bullets.forEach((bullet, i) => {
      if (i < activeIndex) {
        bullet.classList.remove('active');
        bullet.style.setProperty('--progress', '1');
      } else if (i === activeIndex) {
        bullet.classList.add('active');
        bullet.style.setProperty('--progress', '1');
      } else {
        bullet.classList.remove('active');
        bullet.style.setProperty('--progress', '0');
      }
    });

    lastUpdateRef.current = { index: activeIndex, progress: 0 };
  }, []);

  // 手动点击分页条
  const handlePaginationClick = useCallback(
    (index: number) => () => {
      swiperRef.current?.slideToLoop(index);
    },
    []
  );

  // 清理 raf
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
            className="relative ml-auto flex flex-col h-full will-change-transform"
          >
            <div className="flex-1 overflow-hidden">
              <Swiper
                spaceBetween={30}
                modules={[Autoplay, Navigation]}
                loop
                lazy
                preloadImages={false}
                onSwiper={(instance) => {
                  swiperRef.current = instance;
                  if (bulletRefs.current[0]) {
                    bulletRefs.current[0].classList.add('active');
                    bulletRefs.current[0].style.setProperty('--progress', '1');
                  }
                }}
                onSlideChange={handleSlideChange}
                autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
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
                        className="w-full h-full object-cover will-change-transform"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </a>
                  </SwiperSlide>
                ))}

                <div className="absolute right-2 bottom-2 z-1 flex items-center gap-4 bg-black/60 rounded-full p-0.5 will-change-transform">
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
                  className="flex-1 h-0.5 md:h-1 bg-[#818182] relative overflow-hidden cursor-pointer will-change-transform"
                  onClick={handlePaginationClick(index)}
                  data-index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 收缩/展开按钮 */}
      <ZmdRoundIconButton
        className="absolute right-full mr-1 top-1/2 -translate-y-1/2 z-1 w-4 h-12 will-change-transform"
        onClick={() => (uiManager.swiperOpen.value = !uiManager.swiperOpen.value)}
      >
        <ChevronUpTriangle className={cn('transition-transform text-xs', expanded ? 'rotate-90' : 'rotate-270')} />
      </ZmdRoundIconButton>
    </div>
  );
});

export default ZmdSwiper;
