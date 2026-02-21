import { useTranslation } from '@endfieldmap/map-service';
import { BottomSheet } from '@themes/endfield/components/bottom_sheet';
import { LeftContent } from '@themes/endfield/ui/popup/left';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { getRightComponents } from '@/components/common/popup/sub/items';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

const Content = ({ showSubPage, items }: { showSubPage: boolean; items: React.ReactNode[] }) => {
  return (
    <div className="relative flex-1 overflow-hidden">
      <motion.div
        className="absolute inset-0 flex"
        animate={{
          x: showSubPage ? '-100%' : '0%',
        }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
      >
        {/* Left panel - Entity content */}
        <div className="w-full h-full shrink-0">
          <ScrollArea className="w-full h-full px-4">
            <LeftContent />
          </ScrollArea>
        </div>
        {/* Right panel - Sub page content */}
        <div className="w-full h-full shrink-0">
          <ScrollArea className="w-full h-full">{items}</ScrollArea>
        </div>
      </motion.div>
    </div>
  );
};

const MobilePopup: React.FC = observer(() => {
  const { adapter } = useAdapter();
  const { t } = useTranslation('popup');
  const [showSubPage, setShowSubPage] = useState(false);

  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const openTimeRef = useRef(0);

  const handleClose = () => {
    // Prevent ghost clicks
    if (Date.now() - openTimeRef.current < 400) return;
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const open =
    !!activeFeature &&
    !service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode &&
    !service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode;

  const entity = activeFeature?.data;

  const subPopupItems = getRightComponents(entity);
  const showSubPopup = subPopupItems.length > 0;

  const isInSubPage = showSubPage && showSubPopup;

  useEffect(() => {
    setShowSubPage(false);
  }, [activeFeature]);

  useEffect(() => {
    if (open) {
      openTimeRef.current = Date.now();
    }
  }, [open]);

  return (
    <BottomSheet
      open={open}
      collapsed={false}
      dismissible
      onToggleCollapse={handleClose}
      classNames={{
        container: 'rounded-t-md z-12',
      }}
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
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
        <Content showSubPage={isInSubPage} items={subPopupItems} />
      </div>
    </BottomSheet>
  );
});

export default MobilePopup;
