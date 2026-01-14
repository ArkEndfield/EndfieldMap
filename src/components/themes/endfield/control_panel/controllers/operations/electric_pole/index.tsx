import ElectricPoleList from '@/components/themes/endfield/control_panel/controllers/operations/electric_pole/filter_list';
import ElectricPolePresetPanel from '@/components/themes/endfield/control_panel/controllers/operations/electric_pole/preset/panel';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, type SheetRef } from 'react-modal-sheet';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { snapPoints } from '@/const/ui';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

const AnimationWrapper = ({ children, direction }: { children: React.ReactNode; direction: 'left' | 'right' }) => {
  const variants = {
    enter: {
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
    },
  };

  return (
    <motion.div
      className="w-full h-full flex-1 flex flex-col overflow-hidden"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration: 0.1,
      }}
    >
      {children}
    </motion.div>
  );
};

const TabContent = ({ showListTab }: { showListTab: boolean }) => {
  return (
    <AnimatePresence mode="wait">
      {showListTab ? (
        <AnimationWrapper key="list" direction="left">
          <ElectricPoleList />
        </AnimationWrapper>
      ) : (
        <AnimationWrapper key="preset" direction="right">
          <ElectricPolePresetPanel />
        </AnimationWrapper>
      )}
    </AnimatePresence>
  );
};

export const ElectricPoleManager: React.FC = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation('sidebar');
  const [showListTab, setShowListTab] = useState(true);

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <div className="shrink-0 grow-0 mx-3 mt-3 text-sm">
        <EndfieldSwitch
          checked={showListTab}
          onChange={setShowListTab}
          onText={t('operation.electric_pole.tab.list')}
          offText={t('operation.electric_pole.tab.preset')}
        />
      </div>

      <TabContent showListTab={showListTab} />
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
