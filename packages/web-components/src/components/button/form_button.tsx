import { cn } from '@endfieldmap/tools';
import { forwardRef } from 'react';

import buttonTexture from '@endfieldmap/web-components/assets/button-texture.png';
import type { EndfieldFormButtonProps } from '@endfieldmap/web-components/types/form';

import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';

export const EndfieldFormButton = forwardRef<HTMLButtonElement, EndfieldFormButtonProps>((props, ref) => {
  const { children, className, disabled, left, right, variant = 'default', ...rest } = props;

  const isPrimary = variant === 'primary';

  return (
    <ButtonWithAudio
      {...rest}
      ref={ref}
      disabled={disabled}
      className={cn(
        'relative w-full z-1 text-center px-9.5',
        'py-1 px-3.5 rounded-full',
        !disabled && 'shadow-[0_0_3px_#00000044]',
        disabled
          ? {
              'bg-[#EDEBEC]/40 text-[#6e6d6e]': variant === 'default',
              'bg-[#ffee34]/40 text-[#626262]/80': isPrimary,
              'bg-[#ffdfb0]/40 text-[#e56300]/60': variant === 'warning',
              'bg-[#ffe7e7]/40 text-[#f04343]/50 font-bold': variant === 'danger',
            }
          : {
              'bg-[#EDEBEC] hover:bg-[#e0e0e0] active:bg-[#EDEBEC] text-[#373537]': variant === 'default',
              'bg-[#ffee34] hover:bg-[#eddd32] active:bg-[#ffee34] text-[#333]': isPrimary,
              'bg-[#ffdfb0] hover:bg-[#f0d2a3] active:bg-[#ffdfb0] text-[#e56300]': variant === 'warning',
              'bg-[#ffe7e7] hover:bg-[#dcc3c3] active:bg-[#ffe7e7] text-[#f04343] font-bold': variant === 'danger',
            },
        className
      )}
    >
      {isPrimary && (
        <div
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-no-repeat bg-right bg-contain pointer-events-none"
          style={{ backgroundImage: `url(${buttonTexture})` }}
        />
      )}
      {left && (
        <div className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {left}
        </div>
      )}
      {children}
      {right && (
        <div className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {right}
        </div>
      )}
    </ButtonWithAudio>
  );
});
