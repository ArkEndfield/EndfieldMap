import { ButtonWithAudio } from '@endfieldmap/web-components';
import { useIsMobile } from '@endfieldmap/web-components';
import { cn } from '@endfieldmap/tools';

export interface OperateMenuProps {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children?: React.ReactNode;
  active?: boolean;
  rightBorder?: boolean;
  onToggle?: (active: boolean) => void;
}

export const OperateMenu = ({ startIcon, endIcon, children, active, rightBorder, onToggle }: OperateMenuProps) => {
  const isMobile = useIsMobile();
  return (
    <ButtonWithAudio
      className={cn(
        'relative h-full flex-1 md:grow-0',
        active && 'bg-[#fffa00] text-[#313131]',
        rightBorder &&
          'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-4 after:bg-white/25'
      )}
      onClick={() => onToggle?.(!active)}
    >
      {active && !isMobile && (
        <div
          className={cn(
            'absolute left-0 right-0 top-0 bottom-0 bg-no-repeat bg-size-[auto_100%] bg-right bg-[url(/images/bg/button-texture.png)]',
            'mask-[linear-gradient(to_bottom_right,transparent,black_5em,black)]'
          )}
        />
      )}
      <div className="flex w-full items-center gap-2 px-2 md:pb-1 font-medium relative z-1 justify-center md:justify-start md:w-40">
        {startIcon}
        <div className="md:flex-1 text-xl md:text-base">{children}</div>
        {endIcon}
      </div>
    </ButtonWithAudio>
  );
};
