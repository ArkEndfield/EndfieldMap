import { numberPadString } from '@endfieldmap/tools';
import { AnimatePresence, motion } from 'motion/react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/style';

export interface PresetListItemProps {
  index: number;
  title: string;
  active?: boolean;
  select?: boolean;
  onClick?: () => void;
  onToggleSelect?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { pathLength: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

const getHandledFunction = (func?: (e?: MouseEvent) => void) => {
  if (!func) return void 0;
  return function (e: MouseEvent) {
    e.stopPropagation();
    func(e);
  };
};

export const PresetListItem = ({
  index,
  title,
  active,
  select,
  onClick,
  onRename,
  onDelete,
  onToggleSelect,
}: PresetListItemProps) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (!active) onClick?.();
  };

  return (
    <div
      className={cn(
        'w-full relative overflow-hidden flex items-center gap-2 p-2 rounded-lg',
        'border border-white/10 transition-all duration-200',
        'cursor-pointer',
        active
          ? 'bg-blue-500/20 border-blue-500/30 shadow-sm shadow-blue-500/20'
          : 'bg-white/5 hover:bg-white/10 active:scale-[0.98]'
      )}
      onClick={handleClick}
    >
      {/* 选择框 */}
      <button
        className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
          'border border-white/20 transition-all duration-200',
          select ? 'bg-blue-500 border-blue-500' : 'bg-white/10 hover:bg-white/20'
        )}
        onClick={getHandledFunction(onToggleSelect)}
      >
        <AnimatePresence>
          {select && (
            <motion.svg
              key="check"
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.path
                d="M2 6L5 9L10 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* 序号 */}
      <div
        className={cn(
          'text-xs font-mono font-semibold shrink-0 w-6',
          active ? 'text-white' : 'text-white/50'
        )}
      >
        {numberPadString(index, 2)}
      </div>

      {/* 标题 */}
      <div
        className={cn(
          'flex-1 text-xs font-medium overflow-hidden whitespace-nowrap text-ellipsis',
          active ? 'text-white' : 'text-white/70'
        )}
      >
        {title}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={getHandledFunction(onRename)}
          className={cn(
            'px-2 py-1 rounded-md text-[10px] font-medium',
            'transition-all duration-200',
            'border border-white/10',
            'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white',
            'active:scale-95'
          )}
        >
          {t('rename')}
        </button>
        <button
          onClick={getHandledFunction(onDelete)}
          className={cn(
            'px-2 py-1 rounded-md text-[10px] font-medium',
            'transition-all duration-200',
            'border border-white/10',
            'bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400',
            'hover:border-red-500/30',
            'active:scale-95'
          )}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );
};
