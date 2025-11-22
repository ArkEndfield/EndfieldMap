import type { ReactNode } from 'react';
import { motion, useAnimate } from 'motion/react';
import { cn } from '@/utils/style';

export interface ZmdButtonProps {
  type?: 'primary' | 'default';
  text?: string;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  classNames?: {
    button?: string | ((isPrimary: boolean) => string);
    text?: string | ((isPrimary: boolean) => string);
    icon?: string | ((isPrimary: boolean) => string);
  };
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ZmdButton = ({
  type = 'primary',
  text = '',
  showIcon = true,
  iconPosition = 'right',
  classNames = {},
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
}: ZmdButtonProps) => {
  const [buttonRef, buttonAnimate] = useAnimate();
  const isDisabled = disabled;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  const animateEnter = async () => {
    if (isDisabled) return;

    const styles =
      type === 'primary'
        ? {
            backgroundColor: ['#2a272877', '#2a2728b5', '#2a272877', '#2a2728b5'],
            boxShadow: [
              '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
            ],
          }
        : {
            backgroundColor: ['#ececec77', '#e8e8e8b5', '#ececec77', '#e8e8e8b5'],
            boxShadow: [
              '0 0 0 0.1em #ececec77, 0 0 0 0.1em #a5a5a5 inset',
              '0 0 0 0.1em #e8e8e8b5, 0 0 0 0.1em #a5a5a5 inset',
              '0 0 0 0.1em #ececec77, 0 0 0 0.1em #a5a5a5 inset',
              '0 0 0 0.1em #e8e8e8b5, 0 0 0 0.1em #a5a5a5 inset',
            ],
          };

    await buttonAnimate(buttonRef.current, styles, { duration: 0.2 });
  };

  const animateLeave = async () => {
    if (isDisabled) return;

    const styles =
      type === 'primary'
        ? {
            backgroundColor: ['#2a2728b5', '#2a2728', '#2a2728b5', '#2a2728'],
            boxShadow: [
              '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
              '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
            ],
          }
        : {
            backgroundColor: ['#e8e8e8b5', '#f2f1ef', '#e8e8e8b5', '#f2f1ef'],
            boxShadow: [
              '0 0 0 0.1em #e8e8e8b5, 0 0 0 0.1em #a5a5a5 inset',
              '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
              '0 0 0 0.1em #e8e8e8b5, 0 0 0 0.1em #a5a5a5 inset',
              '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
            ],
          };

    await buttonAnimate(buttonRef.current, styles, { duration: 0.2 });
  };

  const isPrimary = type === 'primary';
  const isIconLeft = iconPosition === 'left';

  const iconElement = showIcon && (
    <div
      className={cn(
        'w-[1.3em] h-[1.3em] rounded-full shrink-0 grow-0 flex items-center justify-center transition-colors duration-300',
        isPrimary
          ? 'bg-[#fefcfc] text-[#2a2728] [&_svg]:text-[1.3em]'
          : 'bg-[#4d4d4d] text-[#f2f1ef] [&_svg]:text-[1em]',
        classNames?.icon && (typeof classNames.icon === 'function' ? classNames.icon(isPrimary) : classNames.icon)
      )}
    >
      {loading ? (
        <motion.div
          className="w-[1em] h-[1em] border-2 border-[rgb(255,187,0)] border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      ) : (
        icon
      )}
    </div>
  );

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'flex-1 flex items-center justify-center rounded-full min-w-28',
        isIconLeft ? 'pl-[0.3em] pr-[0.35em] py-[0.3em]' : 'px-[0.35em] py-[0.3em]',
        isPrimary ? 'bg-[#2a2728] text-[#fefcfc]' : 'bg-[#f2f1ef] text-[#4d4d4d]',
        isDisabled && 'opacity-70 pointer-events-none',
        classNames?.button &&
          (typeof classNames.button === 'function' ? classNames.button(isPrimary) : classNames.button)
      )}
      onClick={handleClick}
      onMouseEnter={animateEnter}
      onMouseLeave={animateLeave}
      style={{
        boxShadow: isPrimary
          ? '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset'
          : '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
      }}
      ref={buttonRef}
    >
      {isIconLeft && iconElement}
      <div
        className={cn(
          'flex-1 text-center',
          classNames?.text && (typeof classNames.text === 'function' ? classNames.text(isPrimary) : classNames.text)
        )}
      >
        {children || text}
      </div>
      {!isIconLeft && iconElement}
    </button>
  );
};
