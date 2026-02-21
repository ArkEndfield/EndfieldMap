import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { CustomPointManagerToolbar as Toolbar } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/toolbar';
import CustomPointTypeSelector from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/type_selector';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

export const CustomPointOperationTip = observer(() => {
  const uiManager = useEndfieldUIManager();
  const { adapter } = useAdapter();
  const isCustomPointVisible = adapter.customPointController.dataManager.visible;
  const isOpen = uiManager.currentOperatePanel.value === CurrentOperatePanel.CUSTOM_POINT && isCustomPointVisible;
  const isInCreateMode = service.dataService.mapDataService.customPointDataService.isCreating;

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
              <CustomPointTypeSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toolbar />
    </OperationList>
  );
});
