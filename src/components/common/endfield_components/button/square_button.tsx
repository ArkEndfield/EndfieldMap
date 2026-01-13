import { motion } from 'motion/react';

import type { ZmdButtonProps } from '@/components/common/endfield_components/types/button';
import { cn } from '@/utils/style';

export const ZmdSquareButton = ({
  type = 'primary',
  text = '',
  showIcon = true,
  iconPosition = 'left',
  classNames = {},
  className,
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
}: ZmdButtonProps) => {
  const isDisabled = disabled;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  const isPrimary = type === 'primary';
  const isIconLeft = iconPosition === 'left';

  const iconElement =
    showIcon &&
    !!icon &&
    (loading ? (
      <motion.div
        className="w-4 h-4 border-2 border-[rgb(255,187,0)] border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
    ) : (
      icon
    ));

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'flex items-center justify-center rounded-md min-w-28 box-border relative m-[0.05em] transition-colors text-sm',
        'py-1.5',
        'before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0',
        'before:bg-[url(/images/bg/button-texture.png)] before:bg-cover before:bg-right before:bg-no-repeat',
        isIconLeft ? 'pl-6 pr-1' : 'pl-1 pr-6 before:rotate-180',
        isPrimary
          ? 'bg-[#2a2728] text-[#fefcfc] hover:bg-[#1e1c1c] hover:text-[#f3f1f1] active:bg-[#2a2728] active:text-[#fefcfc]'
          : 'bg-[#f2f1ef] text-[#4d4d4d] hover:bg-[#d4d3d1] hover:text-[#5a5a5a] active:bg-[#f2f1ef] active:text-[#4d4d4d]',
        isPrimary
          ? 'shadow-[0_0_0_0.05em_#2a2728,0_0_0_0.05em_#81807f_inset] hover:shadow-[0_0_0_0.05em_#1e1c1c,0_0_0_0.05em_#81807f_inset] active:shadow-[0_0_0_0.05em_#2a2728,0_0_0_0.05em_#81807f_inset]'
          : 'shadow-[0_0_0_0.05em_#f2f1ef,0_0_0_0.05em_#a0a2a3_inset] hover:shadow-[0_0_0_0.05em_#d4d3d1,0_0_0_0.05em_#a0a2a3_inset] active:shadow-[0_0_0_0.05em_#f2f1ef,0_0_0_0.05em_#a0a2a3_inset]',
        isDisabled && 'opacity-70 pointer-events-none',
        className,
        classNames?.button &&
          (typeof classNames.button === 'function' ? classNames.button(isPrimary) : classNames.button)
      )}
      onClick={handleClick}
    >
      {isIconLeft && iconElement}
      <div
        className={cn(
          'flex-1 text-center z-1',
          classNames?.text && (typeof classNames.text === 'function' ? classNames.text(isPrimary) : classNames.text)
        )}
      >
        {children || text}
      </div>
      {!isIconLeft && iconElement}
    </button>
  );
};
