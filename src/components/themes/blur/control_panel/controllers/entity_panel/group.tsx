import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ChevronUp } from '@/components/common/icons';
import { cn } from '@/utils/style';

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
  iconColor = '#007AFF',
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
    <div className="relative w-full mb-3">
      {/* Header */}
      <button
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-xl',
          'bg-white/5 hover:bg-white/10',
          'transition-all duration-200',
          'border border-white/10',
          'active:scale-[0.98]'
        )}
        onClick={toggleContent}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Icon */}
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              'cursor-pointer hover:scale-110 active:scale-95'
            )}
            style={{ backgroundColor: iconColor + '40' }}
            onClick={handleIconClick}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: iconColor }} />
          </div>

          {/* Title */}
          <div className="flex flex-col items-start">
            <div className="text-sm font-semibold text-white">{title}</div>
            {subtitle && <div className="text-xs text-white/50 uppercase tracking-wider">{subtitle}</div>}
          </div>
        </div>

        {/* Chevron */}
        <ChevronUp className={cn('w-4 h-4 text-white/50 transition-transform duration-200', !isOpen && 'rotate-180')} />
      </button>

      {/* Content Container */}
      <motion.div
        className="overflow-hidden"
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.2, type: 'spring', bounce: 0.25 }}
      >
        <div className="pt-2">{children}</div>
      </motion.div>
    </div>
  );
}
