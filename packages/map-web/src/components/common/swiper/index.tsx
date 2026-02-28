import '@/components/common/swiper/index.css';

import type { SwiperConfig } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { useIsMobile,ZmdRoundIconButton } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronUp, ChevronUpTriangle } from '@endfieldmap/web-components';
import uiManager from '@/services/ui_manager';

export interface SwiperProps {
  expanded?: boolean;
  autoplayDelay?: number;
  autoplay?: boolean;
  config?: SwiperConfig;
  className?: string;
  classNames?: {
    container?: string;
    swiper?: string;
    imageContainer?: string;
    image?: string;
    pagination?: string;
    paginationItem?: string;
    paginationItemActive?: string;
    prevButton?: string;
    nextButton?: string;
    collapseButton?: string;
  };
}

export const Swiper = observer(
  ({
    expanded = false,
    autoplayDelay = 2500,
    autoplay = true,
    config = {
      enable: false,
      list: [],
    },
    className = '',
    classNames = {},
  }: SwiperProps) => {
    const isMobile = useIsMobile();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swiperConfig = config;
    const list = swiperConfig.list;
    const count = list.length;

    // 清理定时器
    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    // 启动自动播放
    const startTimer = useCallback(
      (delay: number) => {
        if (count <= 1 || !autoplay) return;
        clearTimer();
        timerRef.current = setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % count);
        }, delay);
      },
      [count, clearTimer, autoplay]
    );

    // 自动播放逻辑
    useEffect(() => {
      if (!expanded || isHovered || count <= 1 || !autoplay) {
        clearTimer();
        return;
      }
      startTimer(autoplayDelay);
      return clearTimer;
    }, [expanded, isHovered, activeIndex, count, startTimer, clearTimer, autoplay, autoplayDelay]);

    // 导航
    const goTo = useCallback(
      (index: number) => {
        setActiveIndex(((index % count) + count) % count);
      },
      [count]
    );

    const handlePrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
    const handleNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

    // 分页条点击
    const handlePaginationClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const index = (e.target as HTMLElement).dataset.index;
        if (index !== undefined) {
          goTo(Number(index));
        }
      },
      [goTo]
    );

    if (!swiperConfig.enable || count === 0) {
      return null;
    }

    return (
      <div className={cn(className, classNames?.container)}>
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
              className={cn('relative ml-auto flex flex-col h-full', classNames?.swiper)}
            >
              <div
                className={cn(
                  'flex-1 overflow-hidden relative bg-[#1F1F20] border border-[#ffffff]',
                  classNames?.imageContainer
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {list.map((data, index) => (
                  <a
                    key={`${data.cover}-${index}`}
                    href={data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'absolute inset-0 transition-opacity duration-300',
                      index === activeIndex ? 'opacity-100 z-1' : 'opacity-0 z-0'
                    )}
                  >
                    <img
                      src={data.cover}
                      alt=""
                      className={cn('w-full h-full object-cover', classNames?.image)}
                      referrerPolicy="no-referrer"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </a>
                ))}
                <div className="absolute right-2 bottom-2 z-10 flex items-center gap-4 bg-black/60 rounded-full p-0.5">
                  <ZmdRoundIconButton onClick={handlePrev}>
                    <ChevronUp className={cn('rotate-270 text-xs -ml-0.5', classNames?.prevButton)} />
                  </ZmdRoundIconButton>
                  <ZmdRoundIconButton onClick={handleNext}>
                    <ChevronUp className={cn('rotate-90 text-xs -mr-0.5', classNames?.nextButton)} />
                  </ZmdRoundIconButton>
                </div>
              </div>
              {/* 分页条 */}
              <div className={cn('flex gap-0.5 mt-0.5', classNames?.pagination)} onClick={handlePaginationClick}>
                {list.map((_, index) => (
                  <div
                    key={index}
                    data-index={index}
                    className={cn(
                      'flex-1 h-0.5 md:h-1 cursor-pointer',
                      index === activeIndex ? 'bg-[#dfd54a]' : 'bg-[#818182]',
                      classNames?.paginationItem,
                      index === activeIndex ? classNames?.paginationItemActive : ''
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 收缩/展开按钮 */}
        <ZmdRoundIconButton
          className={cn('absolute right-full mr-1 top-1/2 -translate-y-1/2 z-1 w-4 h-12', classNames?.collapseButton)}
          onClick={() => (uiManager.swiperOpen.value = !uiManager.swiperOpen.value)}
        >
          <ChevronUpTriangle className={cn('transition-transform text-xs', expanded ? 'rotate-90' : 'rotate-270')} />
        </ZmdRoundIconButton>
      </div>
    );
  }
);
