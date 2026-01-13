import type { ZmdIconButtonProps } from '@/components/common/endfield_components/types/button';
import { cn } from '@/utils/style';

export const ZmdSquareIconButton = (props: ZmdIconButtonProps) => {
  const { className, children, ...rest } = props;
  return (
    <button
      className={cn(
        'rounded-md w-6 h-6 flex items-center justify-center relative shadow-[0_0_.625rem_rgba(2,2,2,.3)]',
        'bg-[#fafafa] hover:bg-[#e8e8e8] active:bg-[#eeea00] text-[#3c3c3c] transition-colors',
        'before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-full',
        'before:bg-[url(/images/bg/pag-button-texture.png)] before:bg-cover before:bg-center before:bg-no-repeat',
        'before:opacity-40 before:transition-opacity hover:before:opacity-100',
        className
      )}
      {...rest}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 z-1',
          'before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-md before:border-[1.5px] before:border-[#a0a2a3]',
          'after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:rounded-md after:border after:border-white'
        )}
      />
      {children}
    </button>
  );
};
