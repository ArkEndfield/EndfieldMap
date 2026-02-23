import { cn } from '@endfieldmap/tools';
import { debounce, domEventListener } from '@endfieldmap/tools';
import React, { useCallback, useEffect, useRef } from 'react';

type ScrollbarVisibility = 'hidden' | 'auto' | 'scrollbar';

export interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  scrollX?: boolean;
  scrollY?: boolean;
  scrollbarX?: ScrollbarVisibility;
  scrollbarY?: ScrollbarVisibility;
  showScrollButtons?: boolean;
  showEdgeButtons?: boolean;
  contentClassName?: string;
  thumbClassName?: string;
  buttonClassName?: string;
  scrollbarContainerClassName?: string;
  trackClassName?: string;
  autoHide?: boolean;
  scrollBarPlacementStyle?: 'float' | 'block';
  onScroll?: (event: { scrollLeft: number; scrollTop: number }) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  scrollX = true,
  scrollY = true,
  scrollbarX = 'auto',
  scrollbarY = 'auto',
  showScrollButtons = false,
  showEdgeButtons = false,
  contentClassName,
  thumbClassName,
  buttonClassName,
  scrollbarContainerClassName,
  trackClassName,
  autoHide = true,
  scrollBarPlacementStyle = 'float',
  onScroll,
  onScrollStart,
  onScrollEnd,
}) => {
  const disposeFnRef = useRef<(() => void) | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const childObserverRef = useRef<ResizeObserver | null>(null);
  const thumbXRef = useRef<HTMLDivElement>(null);
  const thumbYRef = useRef<HTMLDivElement>(null);
  const scrollbarXContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarYContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const rafUpdateRef = useRef<number | null>(null);

  const stateRef = useRef({
    isDragging: null as 'x' | 'y' | null,
    isHovered: false,
    isScrolling: false,
    dimensions: {
      scrollWidth: 0,
      scrollHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    },
  });

  const updateScrollbarVisibility = useCallback(() => {
    if (!scrollbarXContainerRef.current || !scrollbarYContainerRef.current) return;

    const { isDragging, isHovered, isScrolling } = stateRef.current;
    const isVisible = !autoHide || isHovered || isDragging !== null || isScrolling;

    const opacity = isVisible ? '1' : '0';
    scrollbarXContainerRef.current.style.opacity = opacity;
    scrollbarYContainerRef.current.style.opacity = opacity;
  }, [autoHide]);

  const updateThumbDragState = useCallback((axis: 'x' | 'y' | null) => {
    if (thumbXRef.current) {
      if (axis === 'x') {
        thumbXRef.current.classList.add('opacity-90', 'scale-105');
        thumbXRef.current.classList.remove('opacity-100');
      } else {
        thumbXRef.current.classList.remove('opacity-90', 'scale-105');
        thumbXRef.current.classList.add('opacity-100');
      }
    }

    if (thumbYRef.current) {
      if (axis === 'y') {
        thumbYRef.current.classList.add('opacity-90', 'scale-105');
        thumbYRef.current.classList.remove('opacity-100');
      } else {
        thumbYRef.current.classList.remove('opacity-90', 'scale-105');
        thumbYRef.current.classList.add('opacity-100');
      }
    }
  }, []);

  const updateScrollbarState = useCallback(() => {
    if (!scrollbarXContainerRef.current || !scrollbarYContainerRef.current || !contentRef.current) return;

    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = contentRef.current;

    stateRef.current.dimensions = { scrollWidth, scrollHeight, clientWidth, clientHeight };

    const canScrollX = scrollX && scrollWidth > clientWidth;
    const canScrollY = scrollY && scrollHeight > clientHeight;

    const showBarX = scrollbarX !== 'hidden' && (scrollbarX === 'scrollbar' || (scrollbarX === 'auto' && canScrollX));
    const showBarY = scrollbarY !== 'hidden' && (scrollbarY === 'scrollbar' || (scrollbarY === 'auto' && canScrollY));

    scrollbarXContainerRef.current.style.display = showBarX ? 'flex' : 'none';
    scrollbarYContainerRef.current.style.display = showBarY ? 'flex' : 'none';

    if (!canScrollX) {
      scrollbarXContainerRef.current.style.opacity = '0.5';
      scrollbarXContainerRef.current.style.pointerEvents = 'none';
    } else {
      scrollbarXContainerRef.current.style.pointerEvents = 'auto';
    }

    if (!canScrollY) {
      scrollbarYContainerRef.current.style.opacity = '0.5';
      scrollbarYContainerRef.current.style.pointerEvents = 'none';
    } else {
      scrollbarYContainerRef.current.style.pointerEvents = 'auto';
    }
  }, [scrollX, scrollY, scrollbarX, scrollbarY]);

  const updateThumbPosition = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = contentRef.current;

    if (thumbXRef.current) {
      const widthPercent = (clientWidth / scrollWidth) * 100;
      const leftPercent =
        scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * (100 - widthPercent) : 0;
      thumbXRef.current.style.left = `${leftPercent}%`;
      thumbXRef.current.style.width = `${widthPercent}%`;
    }

    if (thumbYRef.current) {
      const heightPercent = (clientHeight / scrollHeight) * 100;
      const topPercent =
        scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * (100 - heightPercent) : 0;
      thumbYRef.current.style.top = `${topPercent}%`;
      thumbYRef.current.style.height = `${heightPercent}%`;
    }
  }, []);

  const updateDimensions = useCallback(() => {
    updateScrollbarState();
    updateThumbPosition();
    updateScrollbarVisibility();
  }, [updateScrollbarState, updateThumbPosition, updateScrollbarVisibility]);

  const debouncedUpdateDimensionsRef = useRef<(() => void) | null>(null);

  const handleScroll = useCallback(() => {
    if (rafUpdateRef.current !== null) {
      return;
    }

    rafUpdateRef.current = requestAnimationFrame(() => {
      if (!contentRef.current) {
        rafUpdateRef.current = null;
        return;
      }

      const { scrollLeft, scrollTop } = contentRef.current;

      if (onScroll) {
        onScroll({ scrollLeft, scrollTop });
      }

      updateThumbPosition();

      if (autoHide) {
        stateRef.current.isScrolling = true;
        updateScrollbarVisibility();

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          stateRef.current.isScrolling = false;
          updateScrollbarVisibility();
        }, 1000);
      }

      rafUpdateRef.current = null;
    });
  }, [onScroll, autoHide, updateThumbPosition, updateScrollbarVisibility]);

  const scrollTo = useCallback((options: { left?: number; top?: number; smooth?: boolean }) => {
    if (!contentRef.current) return;

    const { left, top, smooth = true } = options;

    if (smooth) {
      contentRef.current.scrollTo({
        left,
        top,
        behavior: 'smooth',
      });
    } else {
      if (left !== undefined) contentRef.current.scrollLeft = left;
      if (top !== undefined) contentRef.current.scrollTop = top;
    }
  }, []);

  const scrollByAmount = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!contentRef.current) return;

      const amount = 100;
      const current = {
        left: contentRef.current.scrollLeft,
        top: contentRef.current.scrollTop,
      };

      switch (direction) {
        case 'up':
          scrollTo({ top: current.top - amount });
          break;
        case 'down':
          scrollTo({ top: current.top + amount });
          break;
        case 'left':
          scrollTo({ left: current.left - amount });
          break;
        case 'right':
          scrollTo({ left: current.left + amount });
          break;
      }
    },
    [scrollTo]
  );

  const scrollToEdge = useCallback(
    (edge: 'top' | 'bottom' | 'left' | 'right') => {
      if (!contentRef.current) return;

      switch (edge) {
        case 'top':
          scrollTo({ top: 0 });
          break;
        case 'bottom':
          scrollTo({ top: contentRef.current.scrollHeight });
          break;
        case 'left':
          scrollTo({ left: 0 });
          break;
        case 'right':
          scrollTo({ left: contentRef.current.scrollWidth });
          break;
      }
    },
    [scrollTo]
  );

  const handleThumbMouseDown = useCallback(
    (axis: 'x' | 'y', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!contentRef.current || !containerRef.current) return;

      stateRef.current.isDragging = axis;
      updateThumbDragState(axis);
      updateScrollbarVisibility();
      onScrollStart?.();

      const bar = (axis === 'x' ? thumbXRef : thumbYRef).current?.parentElement;
      if (!bar) return;

      let rafId: number | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!contentRef.current || !bar) return;

        if (rafId !== null) return;

        rafId = requestAnimationFrame(() => {
          if (!contentRef.current || !bar) {
            rafId = null;
            return;
          }

          const barRect = bar.getBoundingClientRect();

          if (axis === 'x') {
            const mouseX = moveEvent.clientX - barRect.left;
            const barWidth = barRect.width;
            const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
            const thumbWidth = (contentRef.current.clientWidth / contentRef.current.scrollWidth) * barWidth;
            const trackWidth = barWidth - thumbWidth;

            const clampedX = Math.max(0, Math.min(mouseX - thumbWidth / 2, trackWidth));
            const scrollRatio = clampedX / trackWidth;
            contentRef.current.scrollLeft = scrollRatio * maxScroll;
          } else {
            const mouseY = moveEvent.clientY - barRect.top;
            const barHeight = barRect.height;
            const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
            const thumbHeight = (contentRef.current.clientHeight / contentRef.current.scrollHeight) * barHeight;
            const trackHeight = barHeight - thumbHeight;

            const clampedY = Math.max(0, Math.min(mouseY - thumbHeight / 2, trackHeight));
            const scrollRatio = clampedY / trackHeight;
            contentRef.current.scrollTop = scrollRatio * maxScroll;
          }

          rafId = null;
        });
      };

      const handleMouseUp = () => {
        if (!contentRef.current) return;

        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        stateRef.current.isDragging = null;
        updateThumbDragState(null);
        updateScrollbarVisibility();
        onScrollEnd?.();

        requestAnimationFrame(() => {
          updateThumbPosition();
        });

        disposeFnRef.current?.();
      };

      const unlistenMove = domEventListener(document, 'mousemove', handleMouseMove);
      const unlistenUp = domEventListener(document, 'mouseup', handleMouseUp);

      disposeFnRef.current = () => {
        unlistenMove();
        unlistenUp();
        if (rafId !== null) cancelAnimationFrame(rafId);
      };
    },
    [onScrollStart, onScrollEnd, updateThumbDragState, updateScrollbarVisibility, updateThumbPosition]
  );

  const handleBarClick = useCallback(
    (axis: 'x' | 'y', e: React.MouseEvent<HTMLDivElement>) => {
      if (!contentRef.current) return;

      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();

      if (axis === 'x') {
        const clickX = e.clientX - rect.left;
        const barWidth = rect.width;
        const scrollRatio = clickX / barWidth;
        const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
        scrollTo({ left: scrollRatio * maxScroll });
      } else {
        const clickY = e.clientY - rect.top;
        const barHeight = rect.height;
        const scrollRatio = clickY / barHeight;
        const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
        scrollTo({ top: scrollRatio * maxScroll });
      }
    },
    [scrollTo]
  );

  useEffect(() => {
    debouncedUpdateDimensionsRef.current = debounce(() => updateDimensions(), 100) as () => void;

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateDimensionsRef.current?.();
    });

    const childResizeObserver = new ResizeObserver(() => {
      debouncedUpdateDimensionsRef.current?.();
    });
    childObserverRef.current = childResizeObserver;

    const observeChildren = () => {
      if (!contentRef.current) return;
      Array.from(contentRef.current.children).forEach((child) => {
        childResizeObserver.observe(child);
      });
    };

    const mutationObserver = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName?.startsWith('data-')) {
          return false;
        }
        if (mutation.type === 'childList') {
          return true;
        }
        return false;
      });

      if (shouldUpdate) {
        observeChildren();
        debouncedUpdateDimensionsRef.current?.();
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
      observeChildren();
    }

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      childResizeObserver.disconnect();
      childObserverRef.current = null;
      mutationObserver.disconnect();
      if (rafUpdateRef.current !== null) {
        cancelAnimationFrame(rafUpdateRef.current);
      }
    };
  }, [updateDimensions]);

  const scrollButtonSvg = (d: string) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} fill="currentColor" />
    </svg>
  );

  const scrollButtonClass = cn(
    'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
    'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
    buttonClassName
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full min-h-0 flex', className)}
      onMouseEnter={() => {
        stateRef.current.isHovered = true;
        updateScrollbarVisibility();
      }}
      onMouseLeave={() => {
        stateRef.current.isHovered = false;
        updateScrollbarVisibility();
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          'w-full flex-1 min-h-0 overflow-auto scrollbar-hide',
          !scrollX && 'overflow-x-hidden',
          !scrollY && 'overflow-y-hidden',
          contentClassName
        )}
        style={{ scrollBehavior: 'auto' }}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {/* Vertical scrollbar */}
      <div
        ref={scrollbarYContainerRef}
        className={cn(
          'right-1 pl-1 top-0 bottom-0 flex flex-col gap-0.5 transition-opacity duration-300 z-5',
          scrollBarPlacementStyle === 'block' ? 'relative' : 'absolute',
          scrollbarContainerClassName
        )}
      >
        {showEdgeButtons && (
          <button className={scrollButtonClass} onClick={() => scrollToEdge('top')} aria-label="Scroll to top">
            {scrollButtonSvg('M5 1.5L8 4.5L7 5.5L5 3.5L3 5.5L2 4.5L5 1.5Z')}
            {scrollButtonSvg('M5 4.5L8 7.5L7 8.5L5 6.5L3 8.5L2 7.5L5 4.5Z')}
          </button>
        )}

        {showScrollButtons && (
          <button className={scrollButtonClass} onClick={() => scrollByAmount('up')} aria-label="Scroll up">
            {scrollButtonSvg('M5 3L8 6L7 7L5 5L3 7L2 6L5 3Z')}
          </button>
        )}

        <div className="flex-1 relative min-h-0">
          <div
            className={cn('relative w-0.75 rounded-full bg-black/20 h-full left-1/2 -translate-x-1/2', trackClassName)}
            onClick={(e) => handleBarClick('y', e)}
          >
            <div
              ref={thumbYRef}
              className={cn(
                'absolute w-1.25 rounded-full cursor-grab active:cursor-grabbing',
                'bg-[rgb(252,254,254)] left-1/2 -translate-x-1/2 shadow-[0_0_2px_rgba(0,0,0,0.2)]',
                'will-change-transform will-change-height will-change-opacity',
                'opacity-100 hover:opacity-90',
                thumbClassName
              )}
              style={{ transform: 'translateZ(0)' }}
              onMouseDown={(e) => handleThumbMouseDown('y', e)}
            />
          </div>
        </div>

        {showScrollButtons && (
          <button className={scrollButtonClass} onClick={() => scrollByAmount('down')} aria-label="Scroll down">
            {scrollButtonSvg('M5 7L2 4L3 3L5 5L7 3L8 4L5 7Z')}
          </button>
        )}

        {showEdgeButtons && (
          <button className={scrollButtonClass} onClick={() => scrollToEdge('bottom')} aria-label="Scroll to bottom">
            {scrollButtonSvg('M5 8.5L2 5.5L3 4.5L5 6.5L7 4.5L8 5.5L5 8.5Z')}
            {scrollButtonSvg('M5 5.5L2 2.5L3 1.5L5 3.5L7 1.5L8 2.5L5 5.5Z')}
          </button>
        )}
      </div>

      {/* Horizontal scrollbar */}
      <div
        ref={scrollbarXContainerRef}
        className={cn(
          'left-0 right-0 bottom-1 pt-1 flex flex-row transition-opacity duration-300 z-5',
          scrollBarPlacementStyle === 'block' ? 'relative' : 'absolute',
          scrollbarContainerClassName
        )}
      >
        {showEdgeButtons && (
          <button className={scrollButtonClass} onClick={() => scrollToEdge('left')} aria-label="Scroll to left">
            {scrollButtonSvg('M1.5 5L4.5 2L5.5 3L3.5 5L5.5 7L4.5 8L1.5 5Z')}
            {scrollButtonSvg('M4.5 5L7.5 2L8.5 3L6.5 5L8.5 7L7.5 8L4.5 5Z')}
          </button>
        )}

        {showScrollButtons && (
          <button className={scrollButtonClass} onClick={() => scrollByAmount('left')} aria-label="Scroll left">
            {scrollButtonSvg('M3 5L6 2L7 3L5 5L7 7L6 8L3 5Z')}
          </button>
        )}

        <div className="flex-1 relative min-w-0">
          <div
            className={cn('relative h-0.75 rounded-full bg-black/20 w-full top-1/2 -translate-y-1/2', trackClassName)}
            onClick={(e) => handleBarClick('x', e)}
          >
            <div
              ref={thumbXRef}
              className={cn(
                'absolute h-1.25 rounded-full cursor-grab active:cursor-grabbing',
                'bg-[rgb(252,254,254)] top-1/2 -translate-y-1/2 shadow-[0_0_2px_rgba(0,0,0,0.2)]',
                'will-change-transform will-change-width will-change-opacity',
                'opacity-100 hover:opacity-90',
                thumbClassName
              )}
              style={{ transform: 'translateZ(0)' }}
              onMouseDown={(e) => handleThumbMouseDown('x', e)}
            />
          </div>
        </div>

        {showScrollButtons && (
          <button className={scrollButtonClass} onClick={() => scrollByAmount('right')} aria-label="Scroll right">
            {scrollButtonSvg('M7 5L4 8L3 7L5 5L3 3L4 2L7 5Z')}
          </button>
        )}

        {showEdgeButtons && (
          <button className={scrollButtonClass} onClick={() => scrollToEdge('right')} aria-label="Scroll to right">
            {scrollButtonSvg('M8.5 5L5.5 8L4.5 7L6.5 5L4.5 3L5.5 2L8.5 5Z')}
            {scrollButtonSvg('M5.5 5L2.5 8L1.5 7L3.5 5L1.5 3L2.5 2L5.5 5Z')}
          </button>
        )}
      </div>
    </div>
  );
};
