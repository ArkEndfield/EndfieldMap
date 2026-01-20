import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { LayersIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';
import type { ButtonHTMLAttributes } from 'react';

export interface TierTitleProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const TierTitle = (props: TierTitleProps) => {
  const { className, children, ...rest } = props;
  return (
    <ButtonWithAudio
      {...rest}
      className={cn(
        'h-7 bg-black rounded-full flex items-center w-full transition-all duration-300 pl-12 pr-2 gap-2',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      <div className="shrink-0 flex items-center justify-center text-base">
        <LayersIcon />
      </div>
    </ButtonWithAudio>
  );
};
