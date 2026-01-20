import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { PowerIcon, Deco7Dots } from '@/components/common/icons';

import { cn } from '@/utils/style';

export interface PopupHeaderProps {
  onClose: () => void;
  children?: React.ReactNode;
}

const CloseButton = ({ onClick }: { onClick?: () => void }) => (
  <ButtonWithAudio className="text-2xl p-1" onClick={onClick}>
    <PowerIcon />
  </ButtonWithAudio>
);

export const PopupHeader = ({ onClose, children }: PopupHeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between relative px-2 gap-1',
        'h-10 flex items-center justify-end border-b border-[#383938]',
        'before:absolute before:left-0 before:right-0 before:top-0 before:bottom-0 before:-z-1 before:bg-[url(/images/bg/tex_6tri.png)] before:bg-no-repeat before:bg-contain before:bg-right before:opacity-10',
        'after:absolute after:left-0 after:-bottom-1 after:h-1 after:w-16 after:bg-[#383938] after:-z-1'
      )}
    >
      <Deco7Dots className={cn('absolute top-1/2 -translate-y-1/2 scale-x-[-1] text-lg left-1', 'text-[#383938]')} />
      <div className="h-full flex items-center gap-1">{children}</div>
      <CloseButton onClick={onClose} />
    </div>
  );
};
