import Tooltip from '@themes/endfield/components/tooltip';
import ToggleButton from '@themes/endfield/ui/control_panel/components/toggle_button';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { MultiOperationIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';

export const SelectModeOperation = observer(() => {
  const { adapter, dataService } = useAdapter();
  const isSelecting = adapter.mapController.selection.isSelecting;
  const { t } = useTranslation('sidebar');

  const toggleSelectMode = () => {
    if (!isSelecting && dataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info(t('operation.electric_pole_operating_tip'));
      return;
    }
    if (!isSelecting && dataService.customPointDataService.isInCustomPointOperateMode) {
      alert.info(t('operation.custom_point_operating_tip'));
      return;
    }
    if (!adapter.mapController.selection.isSelecting) uiManager.closeAllManagers();
    adapter.mapController.selection.toggleSelecting();
    adapter.activeFeatureController.clearActiveFeature();
  };

  return (
    <Tooltip tooltip={t('operation.multi_operation')} placement="top">
      <ToggleButton value={isSelecting} className="w-8 h-8" onChange={toggleSelectMode}>
        <MultiOperationIcon />
      </ToggleButton>
    </Tooltip>
  );
});
