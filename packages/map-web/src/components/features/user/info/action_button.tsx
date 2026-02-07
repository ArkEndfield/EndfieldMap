import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { cn } from '@/utils/style';

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
  const baseStyles = 'flex items-center justify-center gap-1.5 font-medium transition-all duration-200 rounded';

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

  return (
    <ButtonWithAudio onClick={onClick} className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span className="w-16">{children}</span>
    </ButtonWithAudio>
  );
};
