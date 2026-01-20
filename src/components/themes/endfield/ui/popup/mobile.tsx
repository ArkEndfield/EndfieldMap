import type { EntityData } from '@endfieldmap/map-core';
import { LeftContent } from '@themes/endfield/ui/popup/left';
import { RightContent } from '@themes/endfield/ui/popup/right';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from 'react-modal-sheet';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { ScrollArea } from '@/components/common/scroll_area';
import { snapPoints } from '@/const/ui';
import { useAdapter } from '@/hooks/use_adapter';
import { type RightContentItem, useVisibleRightContentItems } from '@themes/endfield/ui/popup/right_content/items';

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

const Content = ({
  showSubPage,
  items,
  entity,
}: {
  showSubPage: boolean;
  items: RightContentItem[];
  entity?: EntityData;
}) => {
  return (
    <AnimatePresence mode="wait">
      {showSubPage ? (
        <AnimationWrapper key="reward" direction="right">
          <ScrollArea className="w-full h-full px-8">
            {entity && <RightContent items={items} entity={entity} />}
          </ScrollArea>
        </AnimationWrapper>
      ) : (
        <AnimationWrapper key="entity" direction="left">
          <ScrollArea className="w-full h-full px-4">
            <LeftContent />
          </ScrollArea>
        </AnimationWrapper>
      )}
    </AnimatePresence>
  );
};

const MobilePopup: React.FC = observer(() => {
  const { adapter, dataService } = useAdapter();
  const { t } = useTranslation('popup');
  const [showSubPage, setShowSubPage] = useState(false);

  const activeFeature = adapter?.activeFeatureController.activeFeature;

  const handleClose = () => {
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const open =
    !!activeFeature &&
    !dataService.electricPoleDataService.isInElectricOperateMode &&
    !dataService.customPointDataService.isInCustomPointOperateMode;

  const entity = activeFeature?.data;

  const { items: visibleItems, showSubPopup } = useVisibleRightContentItems(entity);

  const isInSubPage = showSubPage && showSubPopup;

  useEffect(() => {
    setShowSubPage(false);
  }, [activeFeature]);

  return (
    <Sheet isOpen={open} onClose={handleClose} snapPoints={snapPoints} initialSnap={5}>
      <Sheet.Container>
        <Sheet.Header className="bg-[#272727] rounded-t-md" />
        <Sheet.Content disableDrag disableScroll className="bg-[#272727] text-white">
          <div className="w-full h-full flex flex-col">
            {showSubPopup ? (
              <div className="shrink-0 grow-0 mx-5 mb-3">
                <EndfieldSwitch
                  checked={!showSubPage}
                  onChange={(v) => setShowSubPage(!v)}
                  onText={t('entity.title')}
                  offText={t('reward.title')}
                />
              </div>
            ) : null}
            <Content showSubPage={isInSubPage} items={visibleItems} entity={entity} />
          </div>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
});

export default MobilePopup;
