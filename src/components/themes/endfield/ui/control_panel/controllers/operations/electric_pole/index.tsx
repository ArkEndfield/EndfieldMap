import ElectricPolePresetPanel from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/panel';
import { forwardRef } from 'react';
import { Sheet, type SheetRef } from 'react-modal-sheet';

import { snapPoints } from '@/const/ui';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

export const ElectricPoleManager: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <ElectricPolePresetPanel />
    </div>
  );
};

export interface ElectricPoleManagerMobileProps {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
}

export const ElectricPoleManagerMobile = forwardRef<SheetRef, ElectricPoleManagerMobileProps>(
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
          <ElectricPoleManager />
        </Sheet.Content>
      </Sheet.Container>
      {dismissable && <Sheet.Backdrop onClick={onClose} />}
    </Sheet>
  )
);
