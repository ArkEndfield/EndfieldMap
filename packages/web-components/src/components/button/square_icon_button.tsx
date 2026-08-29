import { cn } from '@endfieldmap/tools';
import pagButtonTexture from '@endfieldmap/web-components/assets/pag-button-texture.png';
import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';
import type { ZmdIconButtonProps } from '@endfieldmap/web-components/types/button';

export const ZmdSquareIconButton = (props: ZmdIconButtonProps) => {
  const { className, children, ...rest } = props;
  return (
    <ButtonWithAudio
      className={cn(
        'rounded-md w-6 h-6 flex items-center justify-center relative shadow-[0_0_.625rem_rgba(2,2,2,.3)]',
        'bg-[#fafafa] md:hover:bg-[#e8e8e8] active:bg-[#eeea00] text-[#3c3c3c] transition-colors',
        className
      )}
      {...rest}
    >
      <div
        className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-cover bg-center bg-no-repeat opacity-40 transition-opacity hover:opacity-100"
        style={{ backgroundImage: `url(${pagButtonTexture})` }}
      />
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 z-1',
          'before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-md before:border-[1.5px] before:border-[#a0a2a3]',
          'after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:rounded-md after:border after:border-white'
        )}
      />
      {children}
    </ButtonWithAudio>
  );
};
