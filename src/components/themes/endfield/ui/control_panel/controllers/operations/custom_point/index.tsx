import CustomPointPresetPanel from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/preset/panel';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';
import { Sheet, type SheetRef } from 'react-modal-sheet';

import { snapPoints } from '@/const/ui';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

export const CustomPointManager: React.FC = observer(() => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <CustomPointPresetPanel />
    </div>
  );
});

export interface CustomPointManagerMobileProps {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
}

export const CustomPointManagerMobile = forwardRef<SheetRef, CustomPointManagerMobileProps>(
  ({ open, onClose, dismissable = true }, ref) => (
    <Sheet
      ref={ref}
      isOpen={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={4}
      dragVelocityThreshold={1500}
    >
      <Sheet.Container>
        <Sheet.Header className="bg-[#272727] rounded-t-md" />
        <Sheet.Content disableDrag className="text-white">
          <CustomPointManager />
        </Sheet.Content>
      </Sheet.Container>
      {dismissable && <Sheet.Backdrop onClick={onClose} />}
    </Sheet>
  )
);
