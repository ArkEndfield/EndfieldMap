import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useElectricMode } from '@/hooks/use_electric_mode';
import { OperationTip } from '@/components/themes/endfield/components/topbar/operation_tip';
import { useAdapter } from '@/hooks/use_adapter';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import deviceJudge from '@/components/common/device_judge';
import ElectricPoleTypeSelector from '@themes/endfield/control_panel/controllers/operations/electric_pole/type_selector';
import { PoleManagerToolbar } from '@themes/endfield/control_panel/controllers/operations/electric_pole/toolbar';

const TipText = observer(() => {
  const { getCurrentModeTipText } = useElectricMode();
  const { t } = useTranslation('sidebar');
  const tipText = getCurrentModeTipText();
  const lastTipTextRef = useRef(tipText);

  if (tipText) {
    lastTipTextRef.current = tipText;
  }

  const displayText = tipText ?? lastTipTextRef.current;
  if (!displayText) return null;
  return t(`operation.electric_pole.${displayText}.in_mode`);
});

const ElectricPoleManagerToolBar = observer(() => {
  const uiManager = useEndfieldUIManager();
  const { adapter, dataService } = useAdapter();
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;
  const isOpen = uiManager.currentOperatePanel.value === CurrentOperatePanel.ELECTRIC_POLE && isElecricPoleVisible;
  const isInCreateMode = dataService.electricPoleDataService.isCreating;

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
              <ElectricPoleTypeSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PoleManagerToolbar />
    </OperationList>
  );
});

const ElectricPoleModeTip = observer(() => {
  const { dataService } = useAdapter();

  const onClose = () => {
    dataService.electricPoleDataService.stopAllOperation();
  };

  return (
    <OperationTip open={dataService.electricPoleDataService.isInElectricOperateMode} onClose={onClose}>
      <TipText />
    </OperationTip>
  );
});

export const ElectricPoleOperationTip = deviceJudge(ElectricPoleManagerToolBar, ElectricPoleModeTip);
