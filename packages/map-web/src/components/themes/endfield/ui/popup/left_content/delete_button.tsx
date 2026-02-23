import { CustomPointKey, type DataInstance, ElectricPoleDataInstance, ElectricPoleKey } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';
import { Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { ButtonWithAudio } from '@endfieldmap/web-components';
import { TrashIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

export interface DeleteButtonProps {
  entity: DataInstance;
}

export const DeleteButton: React.FC<DeleteButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation();
  const { adapter } = useAdapter();

  const isCustomPoint = entity.entityInfo?.category === CustomPointKey;
  const isElectricPole = entity.entityInfo?.category === ElectricPoleKey;

  const handleDelete = () => {
    if (isCustomPoint) {
      service.dataService.mapDataService.customPointDataService.deleteCustomPoint(
        adapter.mapController.dataManager.currentMapId,
        entity.id
      );
    } else if (isElectricPole) {
      service.dataService.mapDataService.electricPoleDataService.deleteElectricPole(entity as ElectricPoleDataInstance, true);
    }
    // 关闭弹窗
    adapter.activeFeatureController.clearActiveFeature?.();
  };

  if (!isCustomPoint && !isElectricPole) return null;

  return (
    <Tooltip
      tooltip={t('delete')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: 'text-xl p-1 text-white hover:text-red-500 transition-colors',
        onClick: handleDelete,
      }}
    >
      <TrashIcon />
    </Tooltip>
  );
});
