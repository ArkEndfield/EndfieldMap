import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { PoleManagerToolbar } from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/toolbar';
import ElectricPoleTypeSelector from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/type_selector';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';

import { useAdapter } from '@/hooks/use_adapter';

export const ElectricPoleOperationTip = observer(() => {
  const uiManager = useEndfieldUIManager();
  const { adapter, dataService } = useAdapter();
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;
  const isOpen = uiManager.currentOperatePanel.value === CurrentOperatePanel.ELECTRIC_POLE && isElecricPoleVisible;
  const isInCreateMode = dataService.electricPoleDataService.isCreating;

  return (
    <OperationList open={isOpen} className="flex gap-2">
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
