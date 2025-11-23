import React, { useState, useRef, useEffect, useCallback, createElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/utils/style';

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';

export interface TooltipProps<T extends React.ElementType> {
  /** 是否禁用 toiltip */
  disabled?: boolean;
  /** tooltip 内容 */
  tooltip: React.ReactNode;
  /** 触发 tooltip 的组件 */
  children: React.ReactNode;
  /** tooltip 的位置 */
  placement?: Placement;
  /** tooltip 的打开事件 */
  onOpen?: () => void;
  /** tooltip 的关闭事件 */
  onClose?: () => void;
  /** tooltip 的打开状态改变事件 */
  onOpenChange?: (open: boolean) => void;
  /** 自定义传入tooltip的一些类名 */
  classNames?: {
    /** tooltip 的外部容器 */
    toolTipContainer?: string;
    /** tooltip 的顶部边框 */
    topBorder?: string;
    /** tooltip 的内容容器 */
    content?: string;
  };
  /** 指定触发 tooltip 组件渲染的组件 */
  as?: T;
  /** 指定触发 tooltip 组件渲染的组件的 props */
  asProps?: React.ComponentProps<T>;
}

export interface Position {
  top: number;
  left: number;
}

const TOOLTIP_OFFSET = 8;

export const Tooltip = <T extends React.ElementType = 'div'>({
  disabled = false,
  tooltip,
  children,
  placement = 'top',
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
          t = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
          l = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'top-start':
          t = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
          l = triggerRect.left;
          break;
        case 'top-end':
          t = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
          l = triggerRect.right - tooltipRect.width;
          break;
        case 'bottom':
          t = triggerRect.bottom + TOOLTIP_OFFSET;
          l = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom-start':
          t = triggerRect.bottom + TOOLTIP_OFFSET;
          l = triggerRect.left;
          break;
        case 'bottom-end':
          t = triggerRect.bottom + TOOLTIP_OFFSET;
          l = triggerRect.right - tooltipRect.width;
          break;
        case 'left':
          t = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          l = triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET;
          break;
        case 'right':
          t = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          l = triggerRect.right + TOOLTIP_OFFSET;
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
        top = TOOLTIP_OFFSET;
      }
    }

    if (top + tooltipRect.height > viewportHeight) {
      if (placement.startsWith('bottom')) {
        const newPlacement = placement.replace('bottom', 'top') as Placement;
        const newPos = calculateForPlacement(newPlacement);
        top = newPos.t;
        left = newPos.l;
      } else {
        top = viewportHeight - tooltipRect.height - TOOLTIP_OFFSET;
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
        left = TOOLTIP_OFFSET;
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
        left = viewportWidth - tooltipRect.width - TOOLTIP_OFFSET;
      }
    }

    setPosition({ top, left });
  }, [placement]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 0);

      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
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
        children,
      )}

      {isOpen && (
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
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ width: 0, }}
            animate={{ width: 'auto', }}
            exit={{ width: 0, transition: { duration: 0.1, delay: 0.15, ease: 'linear' } }}
            transition={{ duration: 0.1, ease: 'linear' }}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
            className={cn(
              'overflow-hidden rounded-tr-lg max-w-96',
              classNames?.toolTipContainer,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={cn('h-1 bg-[#FDFA85]', classNames?.topBorder)} />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0, transition: { duration: 0.1, ease: 'linear' } }}
              transition={{ duration: 0.1, delay: 0.15, ease: 'linear' }}
              className="overflow-hidden"
            >
              <div className={cn('p-3 text-white text-sm backdrop-blur-xs bg-black/60 rounded-b-xs', classNames?.content)}>{tooltip}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
