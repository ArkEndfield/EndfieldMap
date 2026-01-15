import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useCustomPointMode } from '@/hooks/use_custom_point_mode';
import { OperationTip } from '@themes/endfield/components/topbar/operation_tip';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import deviceJudge from '@/components/common/device_judge';
import { useAdapter } from '@/hooks/use_adapter';

import { CustomPointManagerToolbar as Toolbar } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/toolbar';
import CustomPointTypeSelector from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/type_selector';

const TipText = observer(() => {
  const { getCurrentModeTipText } = useCustomPointMode();
  const { t } = useTranslation('sidebar');
  const tipText = getCurrentModeTipText();
  const lastTipTextRef = useRef(tipText);

  if (tipText) {
    lastTipTextRef.current = tipText;
  }

  const displayText = tipText ?? lastTipTextRef.current;
  if (!displayText) return null;
  return t(`operation.custom_point.${displayText}.in_mode`);
});

const CustomPointManagerToolBar = observer(() => {
  const uiManager = useEndfieldUIManager();
  const { adapter, dataService } = useAdapter();
  const isCustomPointVisible = adapter.customPointController.customPointVisible;
  const isOpen = uiManager.currentOperatePanel.value === CurrentOperatePanel.CUSTOM_POINT && isCustomPointVisible;
  const isInCreateMode = dataService.customPointDataService.isCreating;

  return (
    <OperationList open={isOpen} className="flex gap-2 flex-wrap">
      <AnimatePresence>
        {isInCreateMode && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -20, marginRight: -8 }}
            animate={{ width: 'auto', opacity: 1, x: 0, marginRight: 0 }}
            exit={{ width: 0, opacity: 0, x: -20, marginRight: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="min-w-max">
              <CustomPointTypeSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toolbar />
    </OperationList>
  );
});

const CustomPointModeTip = observer(() => {
  const { dataService } = useAdapter();
  const isInOperateMode = dataService.customPointDataService.isInCustomPointOperateMode;

  const onClose = () => {
    dataService.customPointDataService.stopAllOperation();
  };

  return (
    <OperationTip open={isInOperateMode} onClose={onClose}>
      <TipText />
    </OperationTip>
  );
});

export const CustomPointOperationTip = deviceJudge(CustomPointManagerToolBar, CustomPointModeTip);
