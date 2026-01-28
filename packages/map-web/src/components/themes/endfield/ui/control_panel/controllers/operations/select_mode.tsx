import Tooltip from '@themes/endfield/components/tooltip';
import ToggleButton from '@themes/endfield/ui/control_panel/components/toggle_button';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { MultiOperationIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';

export const SelectModeOperation = observer(() => {
  const { adapter, mapDataService } = useAdapter();
  const isSelecting = adapter.mapController.selection.isSelecting;
  const { t } = useTranslation('sidebar');

  const toggleSelectMode = () => {
    if (!isSelecting && mapDataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info(t('operation.electric_pole_operating_tip'));
      return;
    }
    if (!isSelecting && mapDataService.customPointDataService.isInCustomPointOperateMode) {
      alert.info(t('operation.custom_point_operating_tip'));
      return;
    }
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
