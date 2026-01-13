import { cn } from '@/utils/style';

export interface OperateMenuProps {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children?: React.ReactNode;
  active?: boolean;
  rightBorder?: boolean;
  onToggle?: (active: boolean) => void;
}

export const OperateMenu = ({ startIcon, endIcon, children, active, rightBorder, onToggle }: OperateMenuProps) => {
  return (
    <button
      className={cn(
        'relative h-full',
        active && 'bg-[#fffa00] text-[#313131]',
        rightBorder &&
          'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-4 after:bg-white/25'
      )}
      onClick={() => onToggle?.(!active)}
    >
      {active && (
        <div
          className={cn(
            'absolute left-0 right-0 top-0 bottom-0 bg-no-repeat bg-size-[auto_100%] bg-right bg-[url(/images/bg/button-texture.png)]',
            'mask-[linear-gradient(to_bottom_right,transparent,black_5em,black)]'
          )}
        />
      )}
      <div className="flex items-center gap-2 px-2 pb-1 font-medium relative z-1 w-40">
        {startIcon}
        <div className="flex-1">{children}</div>
        {endIcon}
      </div>
    </button>
  );
};
