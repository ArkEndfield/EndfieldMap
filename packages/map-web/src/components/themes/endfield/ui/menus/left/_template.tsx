import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, useIsMobile } from '@endfieldmap/web-components';

import { Tooltip } from '@/components/common/tooltip';

export interface HeaderMenuProps {
  children?: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  title: string;
  onClick?: () => void;
  hasUnread?: boolean;
}

export const HeaderMenuTemplate: React.FC<HeaderMenuProps> = ({
  children,
  icon,
  title,
  onClick,
  className,
  hasUnread,
}) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <>
        <ButtonWithAudio
          className={cn('text-xl text-[#e0e0e0] h-full flex-1 flex justify-center items-center relative', className)}
          onClick={onClick}
        >
          {icon}
          <div
            className="absolute right-2 top-1.5 rotate-45 bg-[#EE7E31] w-2 h-2 z-1 shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            hidden={!hasUnread}
          >
            <div className="absolute -inset-px border border-[#EE7E31] animate-ping" />
          </div>
        </ButtonWithAudio>
        {children}
      </>
    );
  }
  return (
    <>
      <Tooltip
        tooltip={title}
        asProps={{
          className: 'relative group',
        }}
      >
        <ButtonWithAudio
          className="text-xl text-[#e0e0e0] w-10 h-10 flex justify-center items-center relative"
          onClick={onClick}
        >
          {icon}
          <div
            className="absolute right-0 top-1.5 rotate-45 bg-[#EE7E31] w-2 h-2 z-1 shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            hidden={!hasUnread}
          >
            <div className="absolute -inset-px border border-[#EE7E31] animate-ping" />
          </div>
        </ButtonWithAudio>
        <div className="absolute left-0 top-0 transition-[height_width] duration-600 w-0 h-0 group-hover:h-10 group-hover:w-10 overflow-hidden pointer-events-none">
          <div className="text-xl text-[#FDFA85] w-10 h-10 flex justify-center items-center">{icon}</div>
        </div>
      </Tooltip>
      {children}
    </>
  );
};
