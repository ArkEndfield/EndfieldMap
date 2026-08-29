import { cn } from '@endfieldmap/tools';
import {
  ButtonWithAudio,
  ChevronUp,
  Dialog,
  LogoLoading,
  MapIcon,
  ZmdRoundIconButton,
} from '@endfieldmap/web-components';
import { AnimatePresence, motion } from 'motion/react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { COLLECTION_TABS } from './tabs';

export interface CollectionsProps {
  open: boolean;
  onClose: () => void;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <LogoLoading className="text-2xl" glowColor="#999999" />
  </div>
);

const CollectionTabBar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (key: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(activeTab);
    if (!el) return;
    setIndicatorStyle({
      left: el.offsetLeft + 8,
      width: el.offsetWidth - 16,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    el.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative flex items-center shrink-0 bg-[#f0eeec]">
      {/* Left arrow */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1 z-10 h-full flex items-center"
          >
            <ZmdRoundIconButton onClick={() => scroll('left')} className="text-xs">
              <ChevronUp className="rotate-270" />
            </ZmdRoundIconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex items-stretch overflow-x-auto scrollbar-none px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-stretch mx-auto relative">
          {COLLECTION_TABS.map((tab) => (
            <ButtonWithAudio
              key={tab.key}
              ref={(el: HTMLButtonElement | null) => {
                if (el) tabRefs.current.set(tab.key, el);
              }}
              className={cn(
                'relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors cursor-pointer shrink-0',
                activeTab === tab.key ? 'text-[#363636]' : 'text-[#888] hover:text-[#555]'
              )}
              onClick={() => onTabChange(tab.key)}
            >
              <span className="relative z-1 flex items-center gap-1.5">
                {tab.icon && (
                  <span className="text-base">
                    <tab.icon />
                  </span>
                )}
                {tab.label}
              </span>
            </ButtonWithAudio>
          ))}

          {/* Indicator — positioned outside buttons */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-[#ffff21]"
            style={{ boxShadow: '0 0 6px rgba(255,255,33,0.5)' }}
            animate={indicatorStyle}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>
      </div>

      {/* Right arrow */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-1 z-10 h-full flex items-center"
          >
            <ZmdRoundIconButton onClick={() => scroll('right')} className="text-xs">
              <ChevronUp className="rotate-90" />
            </ZmdRoundIconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#363636]/10" />
    </div>
  );
};

export const Collections = ({ open, onClose }: CollectionsProps) => {
  const [activeTab, setActiveTab] = useState(COLLECTION_TABS[0].key);

  const ActiveComponent = COLLECTION_TABS.find((t) => t.key === activeTab)?.component;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="收集专题"
      icon={<MapIcon />}
      onClose={onClose}
      height="36rem"
      width="56rem"
    >
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Tab bar */}
        <CollectionTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content area */}
        <div className="flex-1 overflow-hidden relative bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="h-full w-full"
            >
              <Suspense fallback={<LoadingFallback />}>
                {ActiveComponent && <ActiveComponent onClose={onClose} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Dialog>
  );
};

export const CollectionsEntry = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ZmdRoundIconButton onClick={() => setOpen(true)}>
        <MapIcon />
      </ZmdRoundIconButton>
      <Collections open={open} onClose={() => setOpen(false)} />
    </>
  );
};
