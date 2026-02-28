import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import type { ButtonHTMLAttributes } from 'react';

import { LayersIcon } from '@/components/common/icons';

export type TierTitleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const TierTitle = (props: TierTitleProps) => {
  const { className, children, ...rest } = props;
  return (
    <ButtonWithAudio
      {...rest}
      className={cn(
        'h-7 w-48 bg-black rounded-full flex items-center transition-all duration-300 pl-12 pr-2 gap-2',
        'lg:h-9 lg:w-64 lg:pl-14 lg:pr-3 lg:gap-3',
        className
      )}
    >
      <div className="flex-1 text-left overflow-hidden">
        <span className="block truncate">{children}</span>
      </div>
      <div className="shrink-0 flex items-center justify-center text-base lg:text-xl">
        <LayersIcon />
      </div>
    </ButtonWithAudio>
  );
};
