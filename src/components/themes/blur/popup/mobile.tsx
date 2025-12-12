import { LeftContent } from '@themes/blur/popup/left';
import { RightContent } from '@themes/blur/popup/right';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from 'react-modal-sheet';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { ScrollArea } from '@/components/common/scroll_area';
import { snapPoints } from '@/const/ui';
import { useAdapter } from '@/hooks/use_adapter';
import { hasReward } from '@/utils/reward';
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
      className="w-full h-full flex-1"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration: 0.2,
        type: 'spring',
        bounce: 0.25,
      }}
    >
      {children}
    </motion.div>
  );
};

const Content = ({ showEntityPage }: { showEntityPage: boolean }) => {
  return (
    <AnimatePresence mode="wait">
      {showEntityPage ? (
        <AnimationWrapper key="entity" direction="left">
          <ScrollArea className="w-full h-full px-4">
            <LeftContent />
          </ScrollArea>
        </AnimationWrapper>
      ) : (
        <AnimationWrapper key="reward" direction="right">
          <ScrollArea className="w-full h-full px-8">
            <RightContent />
          </ScrollArea>
        </AnimationWrapper>
      )}
    </AnimatePresence>
  );
};

const MobilePopup: React.FC = observer(() => {
  const { adapter, dataService } = useAdapter();
  const { t } = useTranslation('popup');
  const [showEntityPage, setShowEntityPage] = useState(true);

  const activeFeature = adapter?.activeFeatureController.activeFeature;

  const handleClose = () => {
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const open =
    !!activeFeature &&
    !dataService.electricPoleDataService.isInElectricOperateMode &&
    !dataService.customPointDataService.isInCustomPointOperateMode;

  const entity = activeFeature?.data;
  const showRewards = entity && hasReward(entity);

  useEffect(() => {
    setShowEntityPage(true);
  }, [activeFeature]);

  return (
    <Sheet isOpen={open} onClose={handleClose} snapPoints={snapPoints} initialSnap={5}>
      <Sheet.Container
        className={cn(
          'bg-black/40 backdrop-blur-2xl',
          'border-t border-white/20',
          'shadow-xl shadow-black/20',
          'transform-gpu'
        )}
      >
        <Sheet.Header className="bg-transparent rounded-t-3xl">
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>
        </Sheet.Header>
        <Sheet.Content disableDrag disableScroll className="bg-transparent text-white">
          <div className="w-full h-full flex flex-col">
            {showRewards && (
              <div className="shrink-0 grow-0 mx-5 mb-3">
                <EndfieldSwitch
                  checked={showEntityPage}
                  onChange={setShowEntityPage}
                  onText={t('entity.title')}
                  offText={t('reward.title')}
                />
              </div>
            )}
            <Content showEntityPage={showEntityPage} />
          </div>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
});

export default MobilePopup;
