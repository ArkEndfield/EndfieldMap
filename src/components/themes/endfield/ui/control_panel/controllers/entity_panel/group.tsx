import { DecoTriTriangle, VisibleWithDeco } from '@/components/common/icons';
import { cn } from '@/utils/style';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface EntityGroupProps {
  iconColor?: string;
  defaultOpen?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  totalCount?: number;
  markedCount?: number;
  onToggle?: (isOpen: boolean) => void;
  onIconClick?: () => void;
}

export default function EntityGroup({
  iconColor = '#FDFB55',
  defaultOpen = true,
  title = 'TITLE',
  subtitle = 'SUBTITLE',
  children,
  totalCount,
  markedCount,
  onToggle,
  onIconClick,
}: EntityGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleContent = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIconClick?.();
  };

  return (
    <div
      className="relative transition-opacity duration-300 ease-in-out w-full z-1 group"
      style={{ opacity: isOpen ? 1 : 0.4 }}
    >
      {/* Header */}
      <button
        className={cn(
          'flex overflow-hidden items-center sticky w-full top-0 z-1 pl-3 py-1 border-b-2 border-[#191919]',
          'before:absolute before:left-0 before:right-0 before:-top-0.5 before:-bottom-1.5 before:z-1 before:bg-[url(/images/bg/tex_6tri.png)] before:bg-no-repeat before:bg-contain before:opacity-10',
          'after:absolute after:left-0 after:right-0 after:top-0 after:bottom-0 after:z-0 after:bg-[repeating-linear-gradient(135deg,transparent,transparent_0.1em,rgba(255,255,255,0.01)_0.15em,rgba(255,255,255,0.01)_0.2em),linear-gradient(to_right,#3d3d3d,#272727)]'
        )}
        onClick={toggleContent}
      >
        {/* Icon */}
        <VisibleWithDeco
          className="shrink-0 grow-0 text-lg mr-2.5 z-2"
          onClick={handleIconClick}
          style={{
            color: iconColor,
          }}
        />

        {/* Title */}
        <div className="text-lg mr-[0.2rem] whitespace-nowrap z-2 truncate text-left font-bold">{title}</div>

        {/* Subtitle */}
        {subtitle && (
          <div className="z-2 flex items-end self-stretch shrink-0 grow-0 w-auto">
            <svg height="8" viewBox={`0 0 ${subtitle.toString().length * 20} 22`} preserveAspectRatio="xMinYMid meet">
              <text
                x="0"
                y="50%"
                dominantBaseline="middle"
                textAnchor="start"
                letterSpacing="0"
                className="fill-current"
                style={{ fontSize: '22px', fontFamily: 'Outline', color: '#959595' }}
              >
                //{subtitle.toString().toUpperCase()}
              </text>
            </svg>
          </div>
        )}

        <div className="z-2 ml-auto shrink-0 grow-0 mr-4">
          <DecoTriTriangle className={cn('transition-transform text-sm', isOpen ? 'rotate-180' : '')} />
        </div>
      </button>

      {/* Content Container */}
      <div className="bg-[#1b1b1b] relative mx-1 z-0">
        <motion.div
          className="overflow-hidden px-1 relative"
          animate={{ height: isOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Content */}
          {children || <div className="text-center text-[0.8em]">...</div>}

          <div className="h-1" />
        </motion.div>
      </div>

      {/* 收集进度条 */}
      {totalCount && (
        <div className="relative font-[Outfit] pb-2">
          <div className="w-full h-0.5 bg-[#898989]">
            <div className="h-full bg-[#fffa00]" style={{ width: `${((markedCount ?? 0) / totalCount) * 100}%` }} />
          </div>
          <div className="text-xs flex relative opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="text-[#fffa00] absolute top-0 -translate-x-1/2"
              style={{
                left: `clamp(calc(0% + ${(markedCount ?? 0).toString().length * 0.35}ch), ${((markedCount ?? 0) / totalCount) * 100}%, calc(100% - ${(markedCount ?? 0).toString().length * 0.35}ch))`,
              }}
            >
              <div
                className="scale-70 tabular-nums origin-top-left"
                style={{
                  width: `${(markedCount ?? 0).toString().length * 0.7}ch`,
                  height: '1em',
                }}
              >
                {markedCount}
              </div>
            </div>
            <div className="ml-auto text-[#a0a0a0] pr-2">
              <div
                className="scale-70 tabular-nums origin-top-left"
                style={{
                  width: `${totalCount.toString().length * 0.7}ch`,
                  height: '1em',
                }}
              >
                {totalCount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
