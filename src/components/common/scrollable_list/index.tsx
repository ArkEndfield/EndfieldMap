import { createContext, type ReactNode,useCallback, useContext, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/style';

export interface ScrollableListProps {
  className?: string;
  children: ReactNode;
  /** ID of the item to center on */
  centerId?: string | null;
  /** Idle timeout in ms before auto-centering (default: 5000) */
  idleTimeout?: number;
}

export const ScrollableList = ({ className, children, centerId, idleTimeout = 5000 }: ScrollableListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Scroll state
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Drag state
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const hasDragged = useRef(false);

  // Idle timer for auto-scroll
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check scroll boundaries
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtTop(scrollTop <= 1);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    setIsScrollable(scrollHeight > clientHeight);
  }, []);

  // Scroll to center a specific item
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

  // Reset idle timer
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

  // Handle scroll event
  const handleScroll = useCallback(() => {
    updateScrollState();
    resetIdleTimer();
  }, [updateScrollState, resetIdleTimer]);

  // Mouse drag handlers
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

  // Prevent click if dragged
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // Auto-scroll when centerId changes
  useEffect(() => {
    if (centerId) {
      scrollToItem(centerId);
    }
  }, [centerId, scrollToItem]);

  // Initial scroll state and cleanup
  useEffect(() => {
    updateScrollState();
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [updateScrollState, resetIdleTimer]);

  // ResizeObserver to detect content changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    resizeObserver.observe(container);
    // Observe children to detect content changes that might affect scroll height
    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  // Register item ref helper
  const registerItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Generate mask gradient based on scroll position
  const getMaskImage = () => {
    if (!isScrollable) return 'none';

    const topGradient = isAtTop ? 'black' : 'transparent';
    const bottomGradient = isAtBottom ? 'black' : 'transparent';

    // Create a mask that fades content at edges
    // When at top: no fade at top (black = visible)
    // When at bottom: no fade at bottom (black = visible)
    return `linear-gradient(to bottom, ${topGradient} 0%, black 15%, black 85%, ${bottomGradient} 100%)`;
  };

  return (
    <ScrollableListContext.Provider value={{ registerItemRef }}>
      {/* Scrollable container with mask */}
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

interface ScrollableListContextType {
  registerItemRef: (id: string, el: HTMLElement | null) => void;
}

const ScrollableListContext = createContext<ScrollableListContextType | null>(null);

export const useScrollableListItem = (id: string) => {
  const context = useContext(ScrollableListContext);
  if (!context) {
    throw new Error('useScrollableListItem must be used within ScrollableList');
  }

  return useCallback(
    (el: HTMLElement | null) => {
      context.registerItemRef(id, el);
    },
    [context, id]
  );
};

// ScrollableListItem component for convenience
export interface ScrollableListItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const ScrollableListItem = ({ id, children, className }: ScrollableListItemProps) => {
  const refCallback = useScrollableListItem(id);

  return (
    <div ref={refCallback} className={className}>
      {children}
    </div>
  );
};
