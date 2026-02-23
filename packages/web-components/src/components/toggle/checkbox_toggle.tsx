import { cn } from '@endfieldmap/tools';
import { AnimatePresence, motion } from 'motion/react';
import type { ButtonHTMLAttributes } from 'react';

import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';

export interface CheckboxToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  label: React.ReactNode;
  onToggle: () => void;
  hideBorder?: boolean;
  isIndeterminate?: boolean;
  size?: 'sm' | 'md';
  indicatorClassName?: string;
}

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { pathLength: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { scaleX: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export const CheckboxToggle: React.FC<CheckboxToggleProps> = ({
  checked,
  label,
  onToggle,
  className,
  disabled,
  hideBorder,
  isIndeterminate,
  size = 'md',
  indicatorClassName,
  ...props
}) => {
  return (
    <ButtonWithAudio
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 transition-colors',
        checked ? 'text-[#FDFB73]' : isIndeterminate ? 'text-[#e2e0ae]' : 'text-[#919191]',
        !hideBorder && 'rounded-full border px-1 pr-2 py-0.5',
        !hideBorder && (checked ? 'border-[#FDFB73]' : isIndeterminate ? 'border-[#e2e0ae]' : 'border-[#444]'),
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full transition-colors',
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          checked || isIndeterminate ? 'bg-[#FDFB73]' : 'bg-[#444]',
          indicatorClassName
        )}
      >
        <AnimatePresence mode="wait">
          {isIndeterminate ? (
            <motion.span
              key="indeterminate"
              className="h-0.5 w-2 rounded-full bg-[#444]"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={lineVariants}
            />
          ) : checked ? (
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
                stroke="#444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
              />
            </motion.svg>
          ) : null}
        </AnimatePresence>
      </span>
      <span className={cn('flex-1 text-left', size === 'sm' ? 'text-xs' : 'text-sm')}>{label}</span>
    </ButtonWithAudio>
  );
};
