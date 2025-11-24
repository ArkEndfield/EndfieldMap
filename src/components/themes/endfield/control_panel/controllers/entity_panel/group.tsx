import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import LocationIcon from './location';

interface EntityGroupProps {
  iconColor?: string;
  defaultOpen?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  onToggle?: (isOpen: boolean) => void;
  onIconClick?: () => void;
}

export default function EntityGroup({
  iconColor = '#FDFB55',
  defaultOpen = true,
  title = 'TITLE',
  subtitle = 'SUBTITLE',
  children,
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
      className="relative -mt-[0.5em] first:mt-0 transition-opacity duration-300 ease-in-out w-full"
      style={{ opacity: isOpen ? 1 : 0.4 }}
    >
      {/* Header */}
      <button
        className="flex items-end sticky w-full top-0 z-1 pl-2 pb-0.5 backdrop-blur-[1em] cursor-pointer hover:outline-1 hover:outline-white/20"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 0.35em), calc(100% - 0.35em) 100%, 0% 100%)',
        }}
        onClick={toggleContent}
      >
        {/* Background with pattern */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[70%] z-1"
          style={{
            backgroundColor: '#4a4a4ac1',
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 0.1em, #4a4a4a89 0.15em, #4a4a4a89 0.2em)',
          }}
        />
        
        {/* Bottom border */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[0.35em] z-1"
          style={{
            background: 'linear-gradient(to right, #d4d4d40b, #afafaf4e)',
          }}
        />

        {/* Icon */}
        <div
          className="shrink-0 grow-0 text-[0.64em] -mb-[0.2em] z-1"
          onClick={handleIconClick}
        >
          <LocationIcon iconColor={iconColor} />
        </div>

        {/* Title */}
        <div className="text-[1.6em] font-black mr-[0.2em] whitespace-nowrap z-1">
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="mb-2 z-1 flex items-end">
            <svg
              width="100%"
              height="8"
              viewBox="0 0 200 20"
              preserveAspectRatio="xMinYMid meet"
              className="max-w-full"
            >
              <text
                x="0"
                y="50%"
                dominantBaseline="middle"
                textAnchor="start"
                letterSpacing="6"
                className="fill-current"
                style={{ fontSize: '16px', fontFamily: 'inherit' }}
              >
                {subtitle}
              </text>
            </svg>
          </div>
        )}
      </button>

      {/* Content Container */}
      <div className="bg-[#1d1d1d] -mt-1.5 relative">
        <motion.div
          className="overflow-hidden pl-4 pr-2 relative"
          animate={{ height: isOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Yellow accent lines */}
          <div
            className="absolute left-[0.4em] top-[0.5em] w-[1.5px] h-[1.5px] bg-[#f9f853]"
          />
          <div
            className="absolute left-[0.4em] top-[0.8em] bottom-[0.4em] w-[1.5px] bg-[#f9f853]"
          />

          {/* 占位 */}
          <div className="h-2.5" />

          {/* Content */}
          {children || (
            <div className="text-center text-[0.8em]">...</div>
          )}


          <div className="h-1" />
        </motion.div>
      </div>
    </div>
  );
}
