import { motion } from 'motion/react';
import { cn } from '@/utils/style';
import type { Key } from 'react';

export interface ToggleOption<T extends Key> {
  key: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface EndfieldToggleProps<T extends Key> {
  options: readonly ToggleOption<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  disabled?: boolean;
  className?: string;
}

export const EndfieldToggle = <T extends Key>({
  options,
  activeKey,
  onChange,
  disabled,
  className,
}: EndfieldToggleProps<T>) => {
  const activeIndex = options.findIndex((opt) => opt.key === activeKey);

  const changeValue = (key: T) => {
    if (disabled) return;
    if (key === activeKey) return;
    onChange(key);
  };

  return (
    <div
      className={cn(
        'flex items-center w-full relative shadow-[0_0_3px_#00000044] rounded-full bg-[#5C5A5D]',
        className
      )}
    >
      <motion.div
        className="absolute left-0 h-full rounded-full bg-[#EDEBEC] shadow-[0_0_3px_#00000066] z-1"
        style={{
          width: `${100 / options.length}%`,
        }}
        initial={{
          x: `${activeIndex * 100}%`,
        }}
        animate={{
          x: `${activeIndex * 100}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      ></motion.div>
      {options.map((option) => {
        const isActive = option.key === activeKey;
        return (
          <button
            key={option.key}
            onClick={() => changeValue(option.key)}
            disabled={disabled}
            className={cn(
              'flex-1 py-1 px-4 flex justify-center items-center gap-2 relative z-2',
              isActive ? 'text-[#373537]' : 'text-[#B3B1B4]'
            )}
          >
            {option.icon && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#373537]">{option.icon}</div>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
