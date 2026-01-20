import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { LayerIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';
import type { ButtonHTMLAttributes } from 'react';

export interface SubTitleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const SubTitle = (props: SubTitleProps) => {
  const { className, children, active, ...rest } = props;
  return (
    <ButtonWithAudio
      {...rest}
      className={cn(
        'h-8 w-64 flex items-center transition-all duration-300 pl-12 pr-2 group overflow-hidden',
        active ? 'opacity-100' : 'opacity-50',
        className
      )}
    >
      <div
        className={cn(
          'h-8 w-8 flex items-center justify-center relative pl-1.5 text-lg',
          'after:absolute after:w-0.5 after:h-4 group-hover:after:h-8 after:bg-white after:-right-0.5 after:transition-all after:duration-300',
          active && 'after:h-8 after:bg-[#fff100] bg-linear-to-r from-transparent to-[#fff100]/50'
        )}
      >
        <LayerIcon />
      </div>

      <div
        className={cn(
          'flex-1 text-left',
          'pl-2 h-full flex items-center overflow-hidden transition-all pr-4',
          active && 'bg-[linear-gradient(to_right,rgba(0,0,0,0.5)_calc(100%-3rem),transparent)]',
          active ? 'text-base' : 'text-sm'
        )}
      >
        <div className="truncate">{children}</div>
      </div>
    </ButtonWithAudio>
  );
};
