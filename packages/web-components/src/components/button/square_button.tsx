import { cn } from '@endfieldmap/tools';
import { motion } from 'motion/react';

import buttonTexture from '@endfieldmap/web-components/assets/button-texture.png';
import texMainBtnDec from '@endfieldmap/web-components/assets/tex_mainBtn_dec.png';
import type { ZmdButtonProps } from '@endfieldmap/web-components/types/button';

import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';
import { Deco7Dots } from '@endfieldmap/web-components/components/icons/common';

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
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  const isPrimary = type === 'primary';
  const isIconLeft = iconPosition === 'left';
  const hasIcon = showIcon && !!icon;

  const iconElement =
    hasIcon &&
    (loading ? (
      <motion.div
        className="w-3 h-3 border-2 border-[rgb(203,203,203)] border-t-white rounded-full"
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
    <ButtonWithAudio
      disabled={isDisabled}
      className={cn(
        'flex items-center justify-center rounded-md min-w-28 box-border relative m-[0.05em] transition-colors text-sm',
        'py-1.5 overflow-hidden',
        hasIcon ? (isIconLeft ? 'pl-7 pr-1' : 'pl-1 pr-7') : 'px-4',
        isPrimary
          ? 'bg-[#2a2728] text-[#fefcfc] md:hover:bg-[#1e1c1c] md:hover:text-[#f3f1f1] active:bg-[#2a2728] active:text-[#fefcfc]'
          : 'bg-[#f2f1ef] text-[#4d4d4d] md:hover:bg-[#d4d3d1] md:hover:text-[#5a5a5a] active:bg-[#f2f1ef] active:text-[#4d4d4d]',
        isPrimary
          ? 'shadow-[0_0_0_0.05em_#2a2728,0_0_0_0.05em_#81807f_inset] md:hover:shadow-[0_0_0_0.05em_#1e1c1c,0_0_0_0.05em_#81807f_inset] active:shadow-[0_0_0_0.05em_#2a2728,0_0_0_0.05em_#81807f_inset]'
          : 'shadow-[0_0_0_0.05em_#f2f1ef,0_0_0_0.05em_#a0a2a3_inset] md:hover:shadow-[0_0_0_0.05em_#d4d3d1,0_0_0_0.05em_#a0a2a3_inset] active:shadow-[0_0_0_0.05em_#f2f1ef,0_0_0_0.05em_#a0a2a3_inset]',
        (isDisabled || loading) && 'pointer-events-none',
        disabled && 'opacity-70',
        className,
        classNames?.button &&
          (typeof classNames.button === 'function' ? classNames.button(isPrimary) : classNames.button)
      )}
      onClick={handleClick}
    >
      {/* Texture overlay (replaces before pseudo) */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 bg-cover bg-no-repeat pointer-events-none',
          isIconLeft ? 'bg-right' : 'bg-right rotate-180'
        )}
        style={{ backgroundImage: `url(${buttonTexture})` }}
      />
      {/* Decoration overlay (replaces after pseudo) */}
      <div
        className={cn(
          'absolute -top-3 -bottom-3 left-0 right-0 opacity-30 bg-contain bg-no-repeat pointer-events-none',
          isIconLeft ? 'bg-left' : 'bg-left rotate-180'
        )}
        style={{ backgroundImage: `url(${texMainBtnDec})` }}
      />
      {hasIcon && (
        <Deco7Dots
          className={cn(
            'absolute top-1/2 -translate-y-1/2 scale-x-[-1] opacity-30 text-xs',
            isIconLeft ? 'left-0' : 'rotate-180 right-0'
          )}
        />
      )}
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
    </ButtonWithAudio>
  );
};
