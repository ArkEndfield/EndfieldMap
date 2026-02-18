import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem } from '@themes/endfield/components/topbar/operation_item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { EditAddIcon, EditDeleteIcon } from '@/components/common/icons';
import { useCustomPointMode } from '@/hooks/use_custom_point_mode';

export const CustomPointManagerToolbar = observer(() => {
  const { toggleMode, getCurrentMode } = useCustomPointMode();
  const { t } = useTranslation('sidebar');
  const currentMode = getCurrentMode();

  // 配置按钮数据
  const tools = [
    {
      key: 'isCreating',
      label: t('operation.custom_point.create.start'),
      icon: <EditAddIcon />,
      active: currentMode === 'isCreating',
      onClick: () => toggleMode('isCreating'),
    },
    {
      key: 'isDeleting',
      label: t('operation.custom_point.delete.start'),
      icon: <EditDeleteIcon />,
      active: currentMode === 'isDeleting',
      onClick: () => toggleMode('isDeleting'),
    },
  ];

  return (
    <OperationContainer className="flex gap-2">
      <OperationItem actions={tools} classNames={{ actions: 'gap-4 pl-2' }} />
    </OperationContainer>
  );
});
