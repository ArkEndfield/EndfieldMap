import { debounce, domEventListener } from '@endfieldmap/tools';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/style';

type ScrollbarVisibility = 'hidden' | 'auto' | 'scrollbar';

export interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;

  // 滚动配置
  scrollX?: boolean;
  scrollY?: boolean;

  // 滚动条显示配置
  scrollbarX?: ScrollbarVisibility;
  scrollbarY?: ScrollbarVisibility;

  // 按钮显示配置
  showScrollButtons?: boolean;
  showEdgeButtons?: boolean;

  // 样式配置
  contentClassName?: string;
  thumbClassName?: string;
  buttonClassName?: string;
  scrollbarContainerClassName?: string;
  trackClassName?: string;

  // 行为配置
  autoHide?: boolean;

  // 滚动条占位方式
  scrollBarPlacementStyle?: 'float' | 'block';

  // 事件
  onScroll?: (event: { scrollLeft: number; scrollTop: number }) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  /** 是否横向滚动 */
  scrollX = true,
  /** 是否竖向滚动 */
  scrollY = true,
  /** 横向滚动条显示模式（auto为自动判断，scrollbar为一直显示，hidden为隐藏） */
  scrollbarX = 'auto',
  /** 竖向滚动条显示模式（auto为自动判断，scrollbar为一直显示，hidden为隐藏） */
  scrollbarY = 'auto',
  /** 是否显示点击滚动按钮 */
  showScrollButtons = false,
  /** 是否显示滚动到两端的按钮 */
  showEdgeButtons = false,
  /** 内容样式 */
  contentClassName,
  /** 滚动条拖动按钮样式 */
  thumbClassName,
  /** 滚动条两侧点击按钮样式 */
  buttonClassName,
  /** 滚动条容器样式 */
  scrollbarContainerClassName,
  /** 滚动条总长度样式 */
  trackClassName,
  /** 是否在非活跃时隐藏 */
  autoHide = true,
  /** 滚动条占位方式，float为浮动，不占用空间，block占用空间 */
  scrollBarPlacementStyle = 'float',
  /** 滚动事件 */
  onScroll,
  /** 滚动开始事件 */
  onScrollStart,
  /** 滚动结束事件 */
  onScrollEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbXRef = useRef<HTMLDivElement>(null);
  const thumbYRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isDraggingRef = useRef(false);

  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
  });

  const [isDragging, setIsDragging] = useState<'x' | 'y' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const isVisible = !autoHide || isHovered || isDragging !== null || isScrolling;

  // 计算滚动条尺寸和位置
  const canScrollX = scrollX && scrollState.scrollWidth > scrollState.clientWidth;
  const canScrollY = scrollY && scrollState.scrollHeight > scrollState.clientHeight;

  const showBarX = scrollbarX !== 'hidden' && (scrollbarX === 'scrollbar' || (scrollbarX === 'auto' && canScrollX));
  const showBarY = scrollbarY !== 'hidden' && (scrollbarY === 'scrollbar' || (scrollbarY === 'auto' && canScrollY));

  const thumbWidthPercent = canScrollX ? (scrollState.clientWidth / scrollState.scrollWidth) * 100 : 100;
  const thumbHeightPercent = canScrollY ? (scrollState.clientHeight / scrollState.scrollHeight) * 100 : 100;

  const thumbLeftPercent =
    canScrollX && scrollState.scrollWidth > scrollState.clientWidth
      ? (scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) * (100 - thumbWidthPercent)
      : 0;
  const thumbTopPercent =
    canScrollY && scrollState.scrollHeight > scrollState.clientHeight
      ? (scrollState.scrollTop / (scrollState.scrollHeight - scrollState.clientHeight)) * (100 - thumbHeightPercent)
      : 0;

  // 更新滚动状态
  const updateScrollState = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = contentRef.current;

    setScrollState({
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    });
  }, []);

  // 防抖版本的更新函数（仅用于 resize/mutation 等非滚动事件）
  const debouncedUpdateScrollStateRef = useRef<(() => void) | null>(null);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    // 滚动时立即更新状态，不使用防抖
    updateScrollState();

    if (onScroll && contentRef.current) {
      onScroll({
        scrollLeft: contentRef.current.scrollLeft,
        scrollTop: contentRef.current.scrollTop,
      });
    }

    if (autoHide) {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }
  }, [onScroll, autoHide, updateScrollState]);

  // 滚动到指定位置
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

  // 按钮滚动
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

  // 滚动到边缘
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

  // 拖拽滚动条
  const handleThumbMouseDown = useCallback(
    (axis: 'x' | 'y', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!contentRef.current || !containerRef.current) return;

      isDraggingRef.current = true;
      setIsDragging(axis);
      onScrollStart?.();

      const bar = (axis === 'x' ? thumbXRef : thumbYRef).current?.parentElement;
      if (!bar) return;

      let dispose: (() => void) | undefined;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!contentRef.current || !bar) return;

        const barRect = bar.getBoundingClientRect();

        if (axis === 'x') {
          const mouseX = moveEvent.clientX - barRect.left;
          const barWidth = barRect.width;
          const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
          const thumbWidth = (contentRef.current.clientWidth / contentRef.current.scrollWidth) * barWidth;
          const trackWidth = barWidth - thumbWidth;

          // 限制在有效范围内
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
      };

      const handleMouseUp = () => {
        if (!contentRef.current) return;

        // 记录松手时的滚动位置
        const finalScroll = axis === 'x' ? contentRef.current.scrollLeft : contentRef.current.scrollTop;

        isDraggingRef.current = false;
        setIsDragging(null);
        onScrollEnd?.();

        // 强制设置最终位置，防止惯性滚动
        requestAnimationFrame(() => {
          if (!contentRef.current) return;
          if (axis === 'x') {
            contentRef.current.scrollLeft = finalScroll;
          } else {
            contentRef.current.scrollTop = finalScroll;
          }
        });

        dispose?.();
      };

      const unlistenMove = domEventListener(document, 'mousemove', handleMouseMove);
      const unlistenUp = domEventListener(document, 'mouseup', handleMouseUp);

      dispose = () => {
        unlistenMove();
        unlistenUp();
      };
    },
    [onScrollStart, onScrollEnd]
  );

  // 点击滚动条轨道
  const handleBarClick = useCallback(
    (axis: 'x' | 'y', e: React.MouseEvent<HTMLDivElement>) => {
      if (!contentRef.current || !containerRef.current) return;

      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();

      if (axis === 'x') {
        const clickX = e.clientX - rect.left;
        const barWidth = rect.width;
        const scrollRatio = clickX / barWidth;
        const maxScroll = scrollState.scrollWidth - scrollState.clientWidth;
        scrollTo({ left: scrollRatio * maxScroll });
      } else {
        const clickY = e.clientY - rect.top;
        const barHeight = rect.height;
        const scrollRatio = clickY / barHeight;
        const maxScroll = scrollState.scrollHeight - scrollState.clientHeight;
        scrollTo({ top: scrollRatio * maxScroll });
      }
    },
    [scrollState, scrollTo]
  );

  // 初始化和更新
  useEffect(() => {
    // 创建防抖函数
    debouncedUpdateScrollStateRef.current = debounce(updateScrollState, 16) as () => void;

    // 立即更新一次
    updateScrollState();

    // 延迟更新，确保 DOM 完全渲染
    const timeoutId = setTimeout(updateScrollState, 0);
    const rafId = requestAnimationFrame(updateScrollState);

    const resizeObserver = new ResizeObserver(() => {
      // 立即更新一次，不防抖
      updateScrollState();
      // 再用防抖版本更新一次，处理连续变化
      debouncedUpdateScrollStateRef.current?.();
    });

    const mutationObserver = new MutationObserver(() => {
      debouncedUpdateScrollStateRef.current?.();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollState]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full min-h-0 flex', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 内容区域 */}
      <div
        ref={contentRef}
        className={cn(
          'w-full flex-1 min-h-0 overflow-auto scrollbar-hide',
          !scrollX && 'overflow-x-hidden',
          !scrollY && 'overflow-y-hidden',
          contentClassName
        )}
        style={{
          scrollBehavior: 'auto',
        }}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {/* 垂直滚动条 */}
      {showBarY && (
        <div
          className={cn(
            'right-1 pl-1 top-0 bottom-0 flex flex-col gap-0.5 transition-opacity duration-300 z-5',
            scrollBarPlacementStyle === 'block' ? 'relative' : 'absolute',
            isVisible ? 'opacity-100' : 'opacity-0',
            !canScrollY && 'opacity-50 pointer-events-none',
            scrollbarContainerClassName
          )}
        >
          {/* 顶部边缘按钮 */}
          {showEdgeButtons && canScrollY && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollToEdge('top')}
              aria-label="滚动到顶部"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1.5L8 4.5L7 5.5L5 3.5L3 5.5L2 4.5L5 1.5Z" fill="currentColor" />
                <path d="M5 4.5L8 7.5L7 8.5L5 6.5L3 8.5L2 7.5L5 4.5Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 上滚动按钮 */}
          {showScrollButtons && canScrollY && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center gap-0.5 rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollByAmount('up')}
              aria-label="向上滚动"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L8 6L7 7L5 5L3 7L2 6L5 3Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 滚动条轨道区域 */}
          <div className="flex-1 relative min-h-0">
            <div
              className={cn(
                'relative w-0.75 rounded-full bg-black/20 h-full left-1/2 -translate-x-1/2',
                trackClassName
              )}
              onClick={(e) => handleBarClick('y', e)}
            >
              <div
                ref={thumbYRef}
                className={cn(
                  'absolute w-1.25 rounded-full cursor-grab active:cursor-grabbing transition-transform',
                  'bg-[rgb(252,254,254)] left-1/2 -translate-x-1/2 shadow-[0_0_2px_rgba(0,0,0,0.2)]',
                  isDragging === 'y' ? 'opacity-90 scale-105' : 'opacity-100 hover:opacity-90',
                  thumbClassName
                )}
                style={{
                  height: `${thumbHeightPercent}%`,
                  top: `${thumbTopPercent}%`,
                }}
                onMouseDown={(e) => handleThumbMouseDown('y', e)}
              />
            </div>
          </div>

          {/* 下滚动按钮 */}
          {showScrollButtons && canScrollY && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollByAmount('down')}
              aria-label="向下滚动"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7L2 4L3 3L5 5L7 3L8 4L5 7Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 底部边缘按钮 */}
          {showEdgeButtons && canScrollY && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollToEdge('bottom')}
              aria-label="滚动到底部"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8.5L2 5.5L3 4.5L5 6.5L7 4.5L8 5.5L5 8.5Z" fill="currentColor" />
                <path d="M5 5.5L2 2.5L3 1.5L5 3.5L7 1.5L8 2.5L5 5.5Z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 水平滚动条 */}
      {showBarX && (
        <div
          className={cn(
            'left-0 right-0 bottom-1 pt-1 flex flex-row transition-opacity duration-300 z-5',
            scrollBarPlacementStyle === 'block' ? 'relative' : 'absolute',
            isVisible ? 'opacity-100' : 'opacity-0',
            !canScrollX && 'opacity-50 pointer-events-none',
            scrollbarContainerClassName
          )}
        >
          {/* 左侧边缘按钮 */}
          {showEdgeButtons && canScrollX && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollToEdge('left')}
              aria-label="滚动到最左边"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 5L4.5 2L5.5 3L3.5 5L5.5 7L4.5 8L1.5 5Z" fill="currentColor" />
                <path d="M4.5 5L7.5 2L8.5 3L6.5 5L8.5 7L7.5 8L4.5 5Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 左滚动按钮 */}
          {showScrollButtons && canScrollX && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollByAmount('left')}
              aria-label="向左滚动"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5L6 2L7 3L5 5L7 7L6 8L3 5Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 滚动条轨道区域 */}
          <div className="flex-1 relative min-w-0">
            <div
              className={cn('relative h-0.75 rounded-full bg-black/20 w-full top-1/2 -translate-y-1/2', trackClassName)}
              onClick={(e) => handleBarClick('x', e)}
            >
              <div
                ref={thumbXRef}
                className={cn(
                  'absolute h-1.25 rounded-full cursor-grab active:cursor-grabbing transition-transform',
                  'bg-[rgb(252,254,254)] top-1/2 -translate-y-1/2 shadow-[0_0_2px_rgba(0,0,0,0.2)]',
                  isDragging === 'x' ? 'opacity-90 scale-105' : 'opacity-100 hover:opacity-90',
                  thumbClassName
                )}
                style={{
                  width: `${thumbWidthPercent}%`,
                  left: `${thumbLeftPercent}%`,
                }}
                onMouseDown={(e) => handleThumbMouseDown('x', e)}
              />
            </div>
          </div>

          {/* 右滚动按钮 */}
          {showScrollButtons && canScrollX && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollByAmount('right')}
              aria-label="向右滚动"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 5L4 8L3 7L5 5L3 3L4 2L7 5Z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* 右侧边缘按钮 */}
          {showEdgeButtons && canScrollX && (
            <button
              className={cn(
                'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded transition-all',
                'bg-black/20 hover:bg-black/40 active:bg-black/50 text-white/80',
                buttonClassName
              )}
              onClick={() => scrollToEdge('right')}
              aria-label="滚动到最右边"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 5L5.5 8L4.5 7L6.5 5L4.5 3L5.5 2L8.5 5Z" fill="currentColor" />
                <path d="M5.5 5L2.5 8L1.5 7L3.5 5L1.5 3L2.5 2L5.5 5Z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
