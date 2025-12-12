import { AnimatePresence, motion } from 'motion/react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/utils/style';

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  label: string;
  onToggle: () => void;
  hideBorder?: boolean;
  isIndeterminate?: boolean;
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

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  label,
  onToggle,
  className,
  disabled,
  hideBorder,
  isIndeterminate,
  ...props
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 transition-all duration-200',
        checked ? 'text-white' : isIndeterminate ? 'text-white/70' : 'text-white/50',
        !hideBorder && 'rounded-lg border px-2.5 py-1.5',
        !hideBorder &&
          (checked
            ? 'border-blue-500/30 bg-blue-500/10'
            : isIndeterminate
              ? 'border-white/20 bg-white/5'
              : 'border-white/10 bg-white/5'),
        !hideBorder && 'hover:bg-white/10',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200',
          checked || isIndeterminate ? 'bg-blue-500' : 'bg-white/20'
        )}
      >
        <AnimatePresence mode="wait">
          {isIndeterminate ? (
            <motion.span
              key="indeterminate"
              className="h-0.5 w-2 rounded-full bg-white"
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
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
              />
            </motion.svg>
          ) : null}
        </AnimatePresence>
      </span>
      <span className="flex-1 text-left text-xs font-medium">{label}</span>
    </button>
  );
};
