import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { cn } from '@/utils/style';

export const SideButton = ({
  children,
  onClick,
  position = 'left',
  level = 0,
}: {
  children: React.ReactNode;
  onClick: () => void;
  position?: 'left' | 'right';
  level?: number;
}) => {
  // 计算底部位置：基础位置 + (按钮高度 + 间距) * 级别
  // 按钮高度 44px (h-11) + 间距 8px = 52px
  const bottomOffset = 8 + level * 52; // 8px 基础 + 52px * level

  return (
    <ButtonWithAudio
      onClick={onClick}
      className={cn(
        'fixed z-2 w-11 h-11 flex flex-col items-center justify-center rounded-sm bg-[#3E3E3C] shadow-[0_0_5px_#00000099] text-xs border-box p-1 text-white',
        position === 'left' ? 'left-4' : 'right-4'
      )}
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div className="absolute -left-[3px] -right-[3px] -bottom-[3px] -top-[3px] rounded-md border-2 border-[#3E3E3C] z-[-1] shadow-sm"></div>
      {children}
    </ButtonWithAudio>
  );
};
