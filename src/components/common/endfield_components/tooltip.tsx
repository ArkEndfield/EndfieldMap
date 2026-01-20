import { domEventListener } from '@endfieldmap/tools';
import { AnimatePresence, motion } from 'motion/react';
import React, { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { Placement, Position, TooltipProps } from '@themes/types/tooltip';
import { cn } from '@/utils/style';
import { useIsMobile } from '@/hooks/use_is_mobile';

const TOOLTIP_OFFSET = 8;

export const Tooltip = <T extends React.ElementType = 'div'>({
  disabled: _disabled = false,
  tooltip,
  children,
  placement = 'top',
  offset = TOOLTIP_OFFSET,
  keepOnHover = true,
  disableOnMobile = true,
  onOpen,
  onClose,
  onOpenChange,
  classNames,
  as: Component = 'div' as T,
  asProps = {} as React.ComponentProps<T>,
}: TooltipProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const disabled = _disabled || (disableOnMobile && isMobile);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !measureRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = measureRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    const calculateForPlacement = (p: Placement) => {
      let t = 0;
      let l = 0;

      switch (p) {
        case 'top':
          t = triggerRect.top - tooltipRect.height - offset;
          l = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'top-start':
          t = triggerRect.top - tooltipRect.height - offset;
          l = triggerRect.left;
          break;
        case 'top-end':
          t = triggerRect.top - tooltipRect.height - offset;
          l = triggerRect.right - tooltipRect.width;
          break;
        case 'bottom':
          t = triggerRect.bottom + offset;
          l = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom-start':
          t = triggerRect.bottom + offset;
          l = triggerRect.left;
          break;
        case 'bottom-end':
          t = triggerRect.bottom + offset;
          l = triggerRect.right - tooltipRect.width;
          break;
        case 'left':
          t = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          l = triggerRect.left - tooltipRect.width - offset;
          break;
        case 'right':
          t = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          l = triggerRect.right + offset;
          break;
      }

      return { t, l };
    };

    const pos = calculateForPlacement(placement);
    top = pos.t;
    left = pos.l;

    // Check boundaries and adjust
    if (top < 0) {
      if (placement.startsWith('top')) {
        const newPlacement = placement.replace('top', 'bottom') as Placement;
        const newPos = calculateForPlacement(newPlacement);
        top = newPos.t;
        left = newPos.l;
      } else {
        top = offset;
      }
    }

    if (top + tooltipRect.height > viewportHeight) {
      if (placement.startsWith('bottom')) {
        const newPlacement = placement.replace('bottom', 'top') as Placement;
        const newPos = calculateForPlacement(newPlacement);
        top = newPos.t;
        left = newPos.l;
      } else {
        top = viewportHeight - tooltipRect.height - offset;
      }
    }

    if (left < 0) {
      if (placement === 'left') {
        const newPos = calculateForPlacement('right');
        top = newPos.t;
        left = newPos.l;
      } else if (placement.includes('end')) {
        const newPlacement = placement.replace('end', 'start') as Placement;
        const newPos = calculateForPlacement(newPlacement);
        left = newPos.l;
      } else {
        left = offset;
      }
    }

    if (left + tooltipRect.width > viewportWidth) {
      if (placement === 'right') {
        const newPos = calculateForPlacement('left');
        top = newPos.t;
        left = newPos.l;
      } else if (placement.includes('start')) {
        const newPlacement = placement.replace('start', 'end') as Placement;
        const newPos = calculateForPlacement(newPlacement);
        left = newPos.l;
      } else {
        left = viewportWidth - tooltipRect.width - offset;
      }
    }

    setPosition({ top, left });
  }, [placement, offset]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 0);

      const unbindScroll = domEventListener(window, 'scroll', calculatePosition, { capture: true });
      const unbindResize = domEventListener(window, 'resize', calculatePosition);

      return () => {
        clearTimeout(timer);
        unbindScroll();
        unbindResize();
      };
    }
  }, [isOpen, calculatePosition]);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isOpen) {
      setIsOpen(true);
      onOpen?.();
      onOpenChange?.(true);
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      onClose?.();
      onOpenChange?.(false);
      closeTimerRef.current = null;
    }, 100);
  };

  return (
    <>
      {createElement(
        Component,
        {
          ...asProps,
          ref: triggerRef,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        },
        children
      )}

      {isOpen &&
        createPortal(
          <div
            ref={measureRef}
            style={{
              position: 'fixed',
              top: -9999,
              left: -9999,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
            className={cn('max-w-96', classNames?.toolTipContainer)}
          >
            <div className={cn('h-1', classNames?.topBorder)} />
            <div className={cn('p-3 text-sm', classNames?.content)}>{tooltip}</div>
          </div>,
          document.body
        )}

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              exit={{ width: 0, transition: { duration: 0.1, delay: 0.15, ease: 'linear' } }}
              transition={{ duration: 0.1, ease: 'linear' }}
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 9999,
              }}
              className={cn('overflow-hidden rounded-tr-lg max-w-96', classNames?.toolTipContainer)}
              onMouseEnter={keepOnHover ? handleMouseEnter : undefined}
              onMouseLeave={keepOnHover ? handleMouseLeave : undefined}
            >
              <div className={cn('h-1 bg-[#FDFA85]', classNames?.topBorder)} />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, transition: { duration: 0.1, ease: 'linear' } }}
                transition={{ duration: 0.1, delay: 0.15, ease: 'linear' }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    'p-3 text-white text-sm backdrop-blur-xs bg-black/60 rounded-b-xs',
                    classNames?.content
                  )}
                >
                  {tooltip}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
