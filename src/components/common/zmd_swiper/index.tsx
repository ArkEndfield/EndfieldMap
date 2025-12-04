import 'swiper/swiper.css';
import './index.css';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ListTitle from '@/components/common/list_title';
import { cn } from '@/utils/style';
import { ChevronUp } from '@/components/common/icons';
import { IconButton } from '@/components/common/endfield_components/icon_button';
import uiManager from '@/services/ui_manager';
import { observer } from 'mobx-react-lite';
import { useAdapter } from '@/hooks/use_adapter';

const ZmdSwiper = observer(() => {
  const expanded = uiManager.swiperOpen.value;
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const progressCircleRef = useRef<SVGSVGElement>(null);
  const progressContentRef = useRef<HTMLSpanElement>(null);
  const swiperRef = useRef<SwiperType>(null);
  const swiperConfig = dataService.swiperDataService.swiperConfig;

  const onAutoplayTimeLeft = useCallback(
    (_: SwiperType, time: number, progress: number) => {
      if (swiperConfig.list.length <= 1) return;
      if (progressCircleRef.current) {
        progressCircleRef.current.style.setProperty('--progress', String(1 - progress));
      }
      if (progressContentRef.current) {
        progressContentRef.current.textContent = String(Math.ceil(time / 1000));
      }
    },
    [swiperConfig.list.length]
  );

  if (!swiperConfig.enable || swiperConfig.list.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-18 md:bottom-12">
      <ListTitle
        color="#1F1F20"
        className="w-auto drop-shadow-[0_0_0.1rem_#FDFD5999]"
        solid={false}
        titleFontSize="1rem"
        backTitleFontSize="1.25rem"
        bracket
        backTitle="ENDFIELD"
        right={
          <button
            className={cn(
              'bg-[#FDFD59] text-[#272727] hover:bg-[#FDFD59] active:bg-[#f2f27a]',
              'rounded-full transition-all duration-200',
              'text-xs font-bold',
              'flex items-center gap-1',
              'px-2 py-0.5 ml-1 mb-1'
            )}
            onClick={() => (uiManager.swiperOpen.value = !uiManager.swiperOpen.value)}
          >
            <div>{t(expanded ? 'fold' : 'unfold')}</div>
          </button>
        }
      >
        BREAKING NEWS
      </ListTitle>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, width: '5rem', opacity: 0 }}
            animate={{
              height: '9rem',
              width: '16rem',
              opacity: 1,
              transition: { duration: 0.5, type: 'spring', bounce: 0.25 },
            }}
            exit={{ height: 0, width: '5rem', opacity: 0, transition: { duration: 0.3 } }}
            className="relative ml-auto"
          >
            <div className="overflow-hidden h-full w-full">
              <Swiper
                spaceBetween={30}
                modules={[Pagination, Autoplay, Navigation]}
                loop
                pagination
                onSwiper={(instance) => (swiperRef.current = instance)}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                onAutoplayTimeLeft={onAutoplayTimeLeft}
                className="h-36 bg-[#1F1F20] shadow-lg text-white overflow-hidden rounded-md zmd-swiper-custom"
              >
                {swiperConfig.list.map((data, index) => (
                  <SwiperSlide
                    key={`${data.cover}-${index}`}
                    className="flex items-center justify-center text-2xl font-bold"
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
                <div className="zmd-swiper-autoplay-progress absolute right-2 bottom-4 z-1 w-6 h-6 flex items-center justify-center font-bold text-(--swiper-theme-color)">
                  <svg
                    viewBox="0 0 48 48"
                    ref={progressCircleRef}
                    className="absolute left-0 top-0 w-full h-full stroke-[0.4em] stroke-(--swiper-theme-color) fill-none [stroke-dasharray:125.6] [stroke-dashoffset:calc(var(--progress)*125.6)] -rotate-90"
                  >
                    <circle cx="24" cy="24" r="20"></circle>
                  </svg>
                  <span ref={progressContentRef} className="text-[0.75em]"></span>
                </div>
              </Swiper>
            </div>
            <IconButton
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-1"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronUp className="rotate-270 text-xs -ml-0.5" />
            </IconButton>
            <IconButton
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-1"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronUp className="rotate-90 text-xs -mr-0.5" />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ZmdSwiper;
