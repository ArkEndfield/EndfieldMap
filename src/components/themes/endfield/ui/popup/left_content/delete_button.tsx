import { CustomPointKey, type DataInstance, ElectricPoleDataInstance, ElectricPoleKey } from '@endfieldmap/map-core';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { TrashIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';

export interface DeleteButtonProps {
  entity: DataInstance;
}

export const DeleteButton: React.FC<DeleteButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation();
  const { dataService, adapter } = useAdapter();

  const isCustomPoint = entity.entityInfo?.category === CustomPointKey;
  const isElectricPole = entity.entityInfo?.category === ElectricPoleKey;

  const handleDelete = () => {
    if (isCustomPoint) {
      dataService.customPointDataService.deleteCustomPoint(adapter.mapController.dataManager.currentMapId, entity.id);
    } else if (isElectricPole) {
      dataService.electricPoleDataService.deleteElectricPole(entity as ElectricPoleDataInstance, true);
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
