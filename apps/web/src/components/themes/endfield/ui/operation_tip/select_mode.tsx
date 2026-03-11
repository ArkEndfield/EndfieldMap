import { type DataInstance, EntityInstanceKey } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';
import { EndfieldFormButton } from '@endfieldmap/web-components';
import { OperationTip } from '@themes/endfield/components/topbar/operation_tip';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

const SelectOperator = observer(() => {
  const { adapter } = useAdapter();

  const selectedFeatures = adapter.mapController.selection.selectedFeatures;
  const { t } = useTranslation(['sidebar', 'common']);

  const markFeatures = (marked: boolean) => {
    selectedFeatures.forEach((feature) => {
      const instance = feature.get(EntityInstanceKey) as DataInstance | undefined;
      if (instance) {
        service.dataService.mapDataService.entityDataService.markEntity(instance.mapId, instance.id, marked);
      }
    });
  };

  const clearSelection = () => {
    adapter.mapController.selection.clearSelection();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-center">{t('sidebar:operation.selected_feature', { val: selectedFeatures.length })}</span>
      <AnimatePresence>
        {selectedFeatures.length > 0 && (
          <motion.div
            className="flex gap-1 overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <EndfieldFormButton className="text-sm py-0.5 px-2" onClick={() => markFeatures(true)}>
              {t('common:operate.mark')}
            </EndfieldFormButton>
            <EndfieldFormButton className="text-sm py-0.5 px-2" onClick={() => markFeatures(false)}>
              {t('common:operate.unmark')}
            </EndfieldFormButton>
            <EndfieldFormButton className="text-sm py-0.5 px-2" variant="primary" onClick={clearSelection}>
              {t('common:operate.clear_selection')}
            </EndfieldFormButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const SelectModeTip = observer(() => {
  const { adapter } = useAdapter();
  const isSelecting = adapter.mapController.selection.isSelecting;
  const stopSelectMode = () => {
    adapter.mapController.selection.stopSelecting();
    adapter.activeFeatureController.clearActiveFeature();
  };
  return (
    <OperationTip open={isSelecting} onClose={stopSelectMode}>
      <SelectOperator />
    </OperationTip>
  );
});
