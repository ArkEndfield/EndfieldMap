import { cn } from '@/utils/style';

interface OperatorToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  onActiveClick: () => void;
  icon: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
}

export const OperatorToggleButton: React.FC<OperatorToggleButtonProps> = ({
  label,
  icon,
  isActive = false,
  isDisabled = false,
  className,
  onClick,
  onActiveClick,
  ...props
}) => {
  return (
    <button
      disabled={isDisabled}
      onClick={isActive ? onActiveClick : onClick}
      className={cn(
        'relative flex items-center justify-center gap-1 py-1.5 px-2 grow shrink',
        'text-xs font-medium rounded-lg transition-all duration-200 select-none',
        'border border-white/10',
        !isActive && !isDisabled && 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white active:scale-95',
        isActive && !isDisabled && 'bg-blue-500/20 text-white border-blue-500/30 shadow-sm shadow-blue-500/20',
        isDisabled && 'opacity-40 bg-white/5 text-white/30 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
};
