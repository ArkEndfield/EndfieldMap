import './index.css';

import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { ChevronUp, ChevronUpTriangle } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const AUTOPLAY_DELAY = 2500;

const ZmdSwiper = observer(() => {
  const expanded = uiManager.swiperOpen.value;
  const isMobile = useIsMobile();
  const { mapDataService } = useAdapter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swiperConfig = mapDataService.swiperDataService.swiperConfig;
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
  const startTimer = useCallback(() => {
    if (count <= 1) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_DELAY);
  }, [count, clearTimer]);

  // 自动播放逻辑
  useEffect(() => {
    if (!expanded || isHovered || count <= 1) {
      clearTimer();
      return;
    }
    startTimer();
    return clearTimer;
  }, [expanded, isHovered, activeIndex, count, startTimer, clearTimer]);

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
            <div
              className="flex-1 overflow-hidden relative bg-[#1F1F20] border border-[#ffffff]"
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
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </a>
              ))}
              <div className="absolute right-2 bottom-2 z-10 flex items-center gap-4 bg-black/60 rounded-full p-0.5">
                <ZmdRoundIconButton onClick={handlePrev}>
                  <ChevronUp className="rotate-270 text-xs -ml-0.5" />
                </ZmdRoundIconButton>
                <ZmdRoundIconButton onClick={handleNext}>
                  <ChevronUp className="rotate-90 text-xs -mr-0.5" />
                </ZmdRoundIconButton>
              </div>
            </div>
            {/* 分页条 */}
            <div className="flex gap-0.5 mt-0.5" onClick={handlePaginationClick}>
              {list.map((_, index) => (
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
