import { cn } from '@endfieldmap/tools';

import pagButtonTexture from '@endfieldmap/web-components/assets/pag-button-texture.png';
import type { ZmdIconButtonProps } from '@endfieldmap/web-components/types/button';

import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';

export const ZmdRoundIconButton = (props: ZmdIconButtonProps) => {
  const { className, children, disabled, ...rest } = props;
  return (
    <ButtonWithAudio
      disabled={disabled}
      className={cn(
        'rounded-full w-6 h-6 flex items-center justify-center relative shadow-[0_0_.625rem_rgba(2,2,2,.3)]',
        'bg-[#fafafa] text-[#3c3c3c] transition-colors',
        !disabled && 'md:hover:bg-[#fffa00] md:active:bg-[#eeea00]',
        disabled && 'opacity-50',
        className
      )}
      {...rest}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 rounded-full bg-cover bg-center bg-no-repeat',
          'opacity-40 transition-opacity',
          !disabled && 'group-hover:opacity-100'
        )}
        style={{ backgroundImage: `url(${pagButtonTexture})` }}
      />
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 z-1',
          'before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-full before:border-[1.5px] before:border-[#e6e6e6]',
          'after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:rounded-full after:border after:border-white'
        )}
      />
      {children}
    </ButtonWithAudio>
  );
};
