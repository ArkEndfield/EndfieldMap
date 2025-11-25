import { EntityInstanceKey, type EndfieldMapAdapter, type MapFeature } from '@endfieldmap/map-core';
import { OperationButton } from './_button';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { dataService } from '@/services/data';
import { alert } from '@/components/common/endfield_components/alert_api';
import { useTranslation } from 'react-i18next';

const SelectOperator = observer(({ adapter }: { adapter: EndfieldMapAdapter }) => {
  const selectedFeatures = adapter.mapController.selection.selectedFeatures;
  const { t } = useTranslation(['sidebar', 'common']);

  const markFeatures = (marked: boolean) => {
    selectedFeatures.forEach((feature) => {
      const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;
      if (instance && typeof instance.setMarked === 'function') {
        instance.setMarked(marked);
      }
    });
  };

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-4">
      <div className="text-sm text-gray-600">{t('sidebar:operation.selected_feature', { val: selectedFeatures.length })}</div>
      {selectedFeatures.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => markFeatures(true)}>
            {t('common:operate.mark')}
          </button>
          <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => markFeatures(false)}>
            {t('common:operate.unmark')}
          </button>
        </div>
      )}
      <button onClick={() => adapter.mapController.selection.stopSelecting()}>{t('operation.cancel_operation')}</button>
    </div>
  );
});

export const SelectModeOperation = observer(({ adapter }: { adapter: EndfieldMapAdapter }) => {
  const isSelecting = adapter.mapController.selection.isSelecting;
  const { t } = useTranslation('sidebar');

  const toggleSelectMode = () => {
    if (!isSelecting && dataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info({
        content: <div className="text-center">{t('operation.electric_pole_operating_tip')}</div>,
      });
      return;
    }
    adapter.mapController.selection.toggleSelecting();
    adapter.activeFeatureController.clearActiveFeature();
  };

  return (
    <>
      <OperationButton
        title={isSelecting ? t('operation.cancel_operation') : t('operation.multi_operation')}
        subtitle="MULTI OPERATION"
        onClick={toggleSelectMode}
      />
      {isSelecting && createPortal(<SelectOperator adapter={adapter} />, document.body)}
    </>
  );
});
