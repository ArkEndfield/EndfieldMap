import type { ThemeNames } from '@/components/themes';
import { cn } from '@/utils/style';

export interface ThemeItemProps {
  name: ThemeNames;
  active: boolean;
  className?: string;
  onClick?: (name: ThemeNames) => void;
}

export const ThemeItem = ({ name, active, className, onClick }: ThemeItemProps) => {
  return (
    <button
      className={cn(
        'relative flex items-center justify-center p-3 border-[1.5px] rounded-sm transition-all',
        'min-w-[120px] cursor-pointer',
        {
          'bg-white/10 border-[#ffee34] text-[#ffee34]': active,
          'bg-white/5 border-white/30 hover:bg-white/10': !active,
        },
        className
      )}
      onClick={() => onClick?.(name)}
    >
      <span className="font-bold text-sm uppercase">{name}</span>
    </button>
  );
};
