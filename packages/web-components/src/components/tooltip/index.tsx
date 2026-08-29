import type { Position, TooltipProps } from '@endfieldmap/map-web-theme-types';
import { cn } from '@endfieldmap/tools';
import { domEventListener } from '@endfieldmap/tools';
import { usePortalContainer } from '@endfieldmap/web-components/contexts/portal';
import { useWindow } from '@endfieldmap/web-components/contexts/window';
import { useIsMobile } from '@endfieldmap/web-components/hooks/use_is_mobile';
import { AnimatePresence, motion } from 'motion/react';
import React, { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const portalContainer = usePortalContainer();
  const currentWindow = useWindow();

  const disabled = _disabled || (disableOnMobile && isMobile);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !measureRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = measureRef.current.getBoundingClientRect();
    const viewportWidth = currentWindow.innerWidth;
    const viewportHeight = currentWindow.innerHeight;

    const calculateForPlacement = (p: typeof placement) => {
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
    let top = pos.t,
      left = pos.l;

    if (top < 0) {
      if (placement.startsWith('top')) {
        const newPlacement = placement.replace('top', 'bottom') as typeof placement;
        const newPos = calculateForPlacement(newPlacement);
        top = newPos.t;
        left = newPos.l;
      } else {
        top = offset;
      }
    }

    if (top + tooltipRect.height > viewportHeight) {
      if (placement.startsWith('bottom')) {
        const newPlacement = placement.replace('bottom', 'top') as typeof placement;
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
        const newPlacement = placement.replace('end', 'start') as typeof placement;
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
        const newPlacement = placement.replace('start', 'end') as typeof placement;
        const newPos = calculateForPlacement(newPlacement);
        left = newPos.l;
      } else {
        left = viewportWidth - tooltipRect.width - offset;
      }
    }

    setPosition({ top, left });
    setContentWidth(tooltipRect.width);
  }, [placement, offset, currentWindow]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 0);

      const unbindScroll = domEventListener(currentWindow, 'scroll', calculatePosition, { capture: true });
      const unbindResize = domEventListener(currentWindow, 'resize', calculatePosition);

      return () => {
        clearTimeout(timer);
        unbindScroll();
        unbindResize();
      };
    }
  }, [isOpen, calculatePosition, tooltip, currentWindow]);

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
            <div className={cn('px-2 text-sm', classNames?.content)}>{tooltip}</div>
          </div>,
          portalContainer || currentWindow.document.body
        )}

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 9999,
              }}
              className={cn(
                'overflow-hidden max-w-96 rounded-xs backdrop-blur-xs bg-black/60 text-white text-sm',
                classNames?.toolTipContainer
              )}
              onMouseEnter={keepOnHover ? handleMouseEnter : undefined}
              onMouseLeave={keepOnHover ? handleMouseLeave : undefined}
            >
              <div className={cn('px-2', classNames?.content)} style={{ width: contentWidth }}>
                {tooltip}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        portalContainer || currentWindow.document.body
      )}
    </>
  );
};
