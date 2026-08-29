import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import { ButtonWithAudio, EditIcon, Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';

export interface RenameButtonProps {
  entity: DataInstance;
}

export const RenameButton: React.FC<RenameButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation(['popup', 'common']);
  const hasRename = entity?.renameable;
  if (!hasRename) return null;
  const entityInfo = entity.entityInfo;

  const isElectricPole = entityInfo?.category === ElectricPoleKey;
  const isCustomPoint = entityInfo?.category === CustomPointKey;

  const handleRename = async () => {
    const currentName = entity.name;
    const content = isElectricPole ? t('popup:electric_pole.rename_tip') : t('popup:custom_point.rename_tip');

    const newName = await alert.prompt({
      content,
      defaultValue: currentName,
    });

    if (newName && newName !== currentName) {
      if (isElectricPole) {
        await service.dataService.mapDataService.electricPoleDataService.renameNode(entity.mapId, entity.id, newName);
        return;
      }
      if (isCustomPoint) {
        await service.dataService.mapDataService.customPointDataService.renameNode(entity.mapId, entity.id, newName);
        return;
      }
    }
  };

  return (
    <Tooltip
      tooltip={t('common:operate.rename')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: 'text-xl p-1',
        onClick: handleRename,
      }}
    >
      <EditIcon />
    </Tooltip>
  );
});
