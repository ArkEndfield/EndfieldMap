import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Sheet } from 'react-modal-sheet';
import { dataService } from '@/services/data';
import { useAdapter } from '@/hooks/use_adapter';
import { snapPoints } from '@/const/ui';
import { LeftContent } from './left';
import { hasReward } from '@/utils/reward';
import { ScrollArea } from '@/components/common/scroll_area';
import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { useTranslation } from 'react-i18next';
import { RightContent } from './right';
import { AnimatePresence, motion } from 'motion/react';

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
        duration: 0.1,
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
  const { adapter } = useAdapter();
  const { t } = useTranslation('popup');
  const [showEntityPage, setShowEntityPage] = useState(true);

  const activeFeature = adapter?.activeFeatureController.activeFeature;

  const handleClose = () => {
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const open = !!activeFeature && !dataService.electricPoleDataService.isInElectricOperateMode;

  const entity = activeFeature?.data;
  const showRewards = entity && hasReward(entity);

  useEffect(() => {
    setShowEntityPage(true);
  }, [activeFeature]);

  return (
    <Sheet isOpen={open} onClose={handleClose} snapPoints={snapPoints} initialSnap={5}>
      <Sheet.Container>
        <Sheet.Header className="bg-[#272727] rounded-t-md" />
        <Sheet.Content disableDrag disableScroll className="bg-[#272727] text-white">
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
