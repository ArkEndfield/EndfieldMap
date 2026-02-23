import { ButtonWithAudio } from '@endfieldmap/web-components';
import { cn } from '@endfieldmap/tools';

// ==================== 通用按钮组件 ====================
export interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const ActionButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  className,
}: ActionButtonProps) => {
  const baseStyles =
    'flex items-center justify-center gap-1.5 font-medium transition-all duration-200 rounded relative group/action-button';

  const variantStyles = {
    primary: 'bg-[#FDFB73] text-black hover:bg-[#e5e366] active:bg-[#ccc95a]',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    outline: 'bg-transparent text-[#FDFB73] border border-[#FDFB73]/50 hover:border-[#FDFB73] hover:bg-[#FDFB73]/10',
    danger: 'bg-red-500 text-white hover:bg-red-400 active:bg-red-600',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  const decorationStyles = {
    primary: 'bg-black',
    secondary: 'bg-[#FEFA53]',
    outline: 'bg-[#FDFB73]',
    danger: 'bg-white',
  };

  return (
    <ButtonWithAudio onClick={onClick} className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
      <div
        className={cn(
          'absolute left-1 top-2 bottom-2 w-1 rounded-full transition-all duration-200 group-hover/action-button:top-1.5 group-hover/action-button:bottom-1.5',
          decorationStyles[variant]
        )}
      />
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span className="w-16">{children}</span>
    </ButtonWithAudio>
  );
};
