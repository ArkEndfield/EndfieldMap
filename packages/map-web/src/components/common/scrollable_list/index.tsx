import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { ScrollableListContext } from '@/components/common/scrollable_list/context';
import { useScrollableListItem } from '@/components/common/scrollable_list/hooks';
import { cn } from '@endfieldmap/tools';

export interface ScrollableListProps {
  className?: string;
  children: ReactNode;
  /** ID 需要居中的 id */
  centerId?: string | null;
  /** 空闲超时时间，超时后自动居中，单位为毫秒 */
  idleTimeout?: number;
}

export interface ScrollableListItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const ScrollableList = ({ className, children, centerId, idleTimeout = 5000 }: ScrollableListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // 滚动状态
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // 拖拽状态
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const hasDragged = useRef(false);

  // 空闲定时器
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 滚动边界检查
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtTop(scrollTop <= 1);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    setIsScrollable(scrollHeight > clientHeight);
  }, []);

  // 滚动到指定项目
  const scrollToItem = useCallback((itemId: string) => {
    const container = scrollContainerRef.current;
    const itemEl = itemRefs.current.get(itemId);
    if (!container || !itemEl) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();

    const itemCenter = itemRect.top + itemRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const scrollOffset = itemCenter - containerCenter;

    container.scrollTo({
      top: container.scrollTop + scrollOffset,
      behavior: 'smooth',
    });
  }, []);

  // 重置空闲定时器
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (centerId) {
      idleTimerRef.current = setTimeout(() => {
        scrollToItem(centerId);
      }, idleTimeout);
    }
  }, [centerId, idleTimeout, scrollToItem]);

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    updateScrollState();
    resetIdleTimer();
  }, [updateScrollState, resetIdleTimer]);

  // 拖拽事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      hasDragged.current = false;
      startY.current = e.clientY;
      startScrollTop.current = scrollContainerRef.current?.scrollTop ?? 0;
      resetIdleTimer();
    },
    [resetIdleTimer]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaY = e.clientY - startY.current;
    if (Math.abs(deltaY) > 3) {
      hasDragged.current = true;
    }

    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = startScrollTop.current - deltaY;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  // 如果拖拽了，阻止点击
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // centerId 变化时自动滚动
  useEffect(() => {
    if (centerId) {
      scrollToItem(centerId);
    }
  }, [centerId, scrollToItem]);

  // 初始化滚动状态和清理
  useEffect(() => {
    updateScrollState();
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [updateScrollState, resetIdleTimer]);

  // ResizeObserver 检测内容变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    resizeObserver.observe(container);
    // 监听 children 变化，检测内容变化，可能影响 scroll height
    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  // 注册子项 ref
  const registerItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // 基于滚动位置生成 mask gradient
  const getMaskImage = () => {
    if (!isScrollable) return 'none';

    const topGradient = isAtTop ? 'black' : 'transparent';
    const bottomGradient = isAtBottom ? 'black' : 'transparent';

    // 创建一个 mask，淡出内容在边缘
    // 当在顶部：顶部不淡出（黑色 = 可见）
    // 当在底部：底部不淡出（黑色 = 可见）
    return `linear-gradient(to bottom, ${topGradient} 0%, black 15%, black 85%, ${bottomGradient} 100%)`;
  };

  return (
    <ScrollableListContext.Provider value={{ registerItemRef }}>
      {/* 可滚动的容器，带有 mask */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'relative overflow-y-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none transition-[mask-image] duration-300',
          className
        )}
        style={{
          maskImage: getMaskImage(),
          WebkitMaskImage: getMaskImage(),
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </ScrollableListContext.Provider>
  );
};

export const ScrollableListItem = ({ id, children, className }: ScrollableListItemProps) => {
  const refCallback = useScrollableListItem(id);

  return (
    <div ref={refCallback} className={className}>
      {children}
    </div>
  );
};
