import { EndfieldSquareSwitch } from '@themes/endfield/components/switch';
// import { OperatorToggleButton } from '@themes/endfield/control_panel/controllers/operations/components/button';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem } from '@themes/endfield/components/topbar/operation_item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EditAddIcon, EditConnectIcon, EditDeleteIcon, EditDisconnectIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useElectricMode } from '@/hooks/use_electric_mode';

export const PoleManagerToolbar = observer(() => {
  const { t } = useTranslation('sidebar');
  const { mapDataService, adapter } = useAdapter();
  const { getCurrentMode, toggleMode } = useElectricMode();
  const currentMode = getCurrentMode();
  const isAutoConnect = mapDataService.electricPoleDataService.autoConnect;
  const isZoneVisible = adapter.electricPoleController.dataManager.zoneVisible;
  const isInCreateMode = mapDataService.electricPoleDataService.isCreating;
  // 配置按钮数据
  const tools = [
    {
      key: 'isCreating',
      label: t('operation.electric_pole.create.start'),
      icon: <EditAddIcon />,
      active: currentMode === 'isCreating',
      onClick: () => toggleMode('isCreating'),
    },
    {
      key: 'isDeleting',
      label: t('operation.electric_pole.delete.start'),
      icon: <EditDeleteIcon />,
      active: currentMode === 'isDeleting',
      onClick: () => toggleMode('isDeleting'),
    },
    {
      key: 'isConnecting',
      label: t('operation.electric_pole.connect.start'),
      icon: <EditConnectIcon />,
      active: currentMode === 'isConnecting',
      onClick: () => toggleMode('isConnecting'),
    },
    {
      key: 'isDeletingConnection',
      label: t('operation.electric_pole.connect.delete.start'),
      icon: <EditDisconnectIcon />,
      active: currentMode === 'isDeletingConnection',
      onClick: () => toggleMode('isDeletingConnection'),
    },
  ];
  return (
    <OperationContainer className="flex gap-2">
      <OperationItem rightBorder actions={tools} classNames={{ actions: 'gap-4 pl-2' }} />
      <div className="flex flex-col justify-center gap-0.5 items-end">
        {isInCreateMode && (
          <EndfieldSquareSwitch
            value={isAutoConnect}
            onValueChange={() => mapDataService.electricPoleDataService.toggleAutoConnect()}
            label={t('operation.electric_pole.create.auto_connect')}
            className="mr-4"
          />
        )}
        <EndfieldSquareSwitch
          value={isZoneVisible}
          onValueChange={() => mapDataService.electricPoleDataService.toggleZoneVisibility()}
          label={t('operation.electric_pole.zone.display')}
          className="mr-4"
        />
      </div>
    </OperationContainer>
  );
});
