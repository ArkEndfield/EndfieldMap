import { Tooltip } from '@/components/common/tooltip/tooltip';
import { useIsMobile } from '@/hooks/use_is_mobile';

export interface HeaderMenuProps {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}

export const HeaderMenuTemplate: React.FC<HeaderMenuProps> = ({ children, icon, title, onClick }) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <>
        <button className="text-xl text-[#e0e0e0] w-20 h-10 flex justify-center items-center" onClick={onClick}>
          {icon}
        </button>
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
        <button className="text-xl text-[#e0e0e0] w-10 h-10 flex justify-center items-center" onClick={onClick}>
          {icon}
        </button>
        <div className="absolute left-0 top-0 transition-[height_width] duration-600 w-0 h-0 group-hover:h-10 group-hover:w-10 overflow-hidden pointer-events-none">
          <div className="text-xl text-[#FDFA85] w-10 h-10 flex justify-center items-center">{icon}</div>
        </div>
      </Tooltip>
      {children}
    </>
  );
};
