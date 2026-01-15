import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useElectricMode } from '@/hooks/use_electric_mode';
import { EditAddIcon, EditDeleteIcon, EditConnectIcon, EditDisconnectIcon } from '@/components/common/icons';
// import { OperatorToggleButton } from '@themes/endfield/control_panel/controllers/operations/components/button';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem } from '@themes/endfield/components/topbar/operation_item';
import { EndfieldSquareSwitch } from '@themes/endfield/components/switch';
import { useAdapter } from '@/hooks/use_adapter';

export const PoleManagerToolbar = observer(() => {
  const { t } = useTranslation('sidebar');
  const { dataService, adapter } = useAdapter();
  const { getCurrentMode, toggleMode } = useElectricMode();
  const currentMode = getCurrentMode();
  const isAutoConnect = dataService.electricPoleDataService.autoConnect;
  const isZoneVisible = adapter.electricPoleController.zoneVisible;
  const isInCreateMode = dataService.electricPoleDataService.isCreating;
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
            onValueChange={() => dataService.electricPoleDataService.toggleAutoConnect()}
            label={t('operation.electric_pole.create.auto_connect')}
            className="mr-4"
          />
        )}
        <EndfieldSquareSwitch
          value={isZoneVisible}
          onValueChange={() => dataService.electricPoleDataService.toggleZoneVisibility()}
          label={t('operation.electric_pole.zone.display')}
          className="mr-4"
        />
      </div>
    </OperationContainer>
  );
});
