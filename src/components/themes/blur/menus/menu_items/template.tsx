import { Tooltip } from '@/components/common/tooltip/tooltip';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

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
        <button
          className={cn(
            'text-xl text-white/80 w-12 h-12 flex justify-center items-center',
            'rounded-full transition-all duration-200',
            'bg-black/40 backdrop-blur-2xl',
            'border border-white/20',
            'shadow-lg shadow-black/20',
            'hover:bg-black/50 active:bg-black/60 active:scale-95'
          )}
          onClick={onClick}
        >
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
          className: 'relative',
        }}
      >
        <button
          className={cn(
            'text-xl text-white/80 w-14 h-14 flex justify-center items-center',
            'rounded-full transition-all duration-200',
            'bg-black/40 backdrop-blur-2xl',
            'border border-white/20',
            'shadow-lg shadow-black/20',
            'hover:bg-black/50 hover:text-white active:bg-black/60 active:scale-95'
          )}
          onClick={onClick}
        >
          {icon}
        </button>
      </Tooltip>
      {children}
    </>
  );
};
