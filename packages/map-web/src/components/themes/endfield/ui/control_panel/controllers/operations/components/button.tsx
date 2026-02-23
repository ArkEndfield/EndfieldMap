import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';

export interface OperatorToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮显示的标签文本 */
  label: string;
  /** 激活状态的点击事件 */
  onActiveClick: () => void;
  /** 图标元素 */
  icon: React.ReactNode;
  /** 是否处于激活状态 */
  isActive?: boolean;
  /** 是否禁用 */
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
    <ButtonWithAudio
      disabled={isDisabled}
      onClick={isActive ? onActiveClick : onClick}
      className={cn(
        'relative flex items-center justify-center gap-0.5 py-1 grow shrink group',
        'text-sm font-medium border transition-all duration-200 overflow-hidden select-none',
        !isActive &&
          !isDisabled &&
          'bg-[#333] border-[#444] text-gray-400 hover:bg-[#3d3d3d] hover:text-white hover:border-gray-500',
        isActive &&
          !isDisabled &&
          'bg-[rgba(252,238,33,0.15)] border-[#fcee21] shadow-[inset_0_0_10px_rgba(252,238,33,0.1)]',
        isDisabled && 'opacity-40 bg-[#2a2a2a] text-gray-600',
        className
      )}
      {...props}
    >
      {/* 图标容器 */}
      <span className="text-base shrink-0">{icon}</span>

      {/* 文本 */}
      <span className="pr-1">{label}</span>

      <div
        className={cn(
          'absolute bottom-0 right-0 w-0 h-0',
          'border-b-8 border-r-8 rotate-90',
          'border-b-transparent transition-colors',
          isActive && (isDisabled ? 'border-r-[rgba(252,238,33,0.15)]' : 'border-r-[#fcee21]'),
          !isActive && (isDisabled ? 'opacity-60' : 'border-r-[#444] group-hover:border-r-gray-500')
        )}
        aria-hidden="true"
      />
    </ButtonWithAudio>
  );
};
