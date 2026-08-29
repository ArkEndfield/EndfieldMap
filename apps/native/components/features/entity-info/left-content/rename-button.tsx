import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { alertApi } from '@/components/ui/alert/alert-api';
import { service } from '@/services/map-service';

interface RenameButtonProps {
  entity: DataInstance;
}

export const RenameButton = observer(function RenameButton({ entity }: RenameButtonProps) {
  const { t } = useTranslation(['popup', 'common']);

  if (!entity?.renameable) return null;

  const entityInfo = entity.entityInfo;
  const isElectricPole = entityInfo?.category === ElectricPoleKey;
  const isCustomPoint = entityInfo?.category === CustomPointKey;

  const handleRename = async () => {
    const currentName = entity.name;
    const content = isElectricPole
      ? t('popup:electric_pole.rename_tip', { defaultValue: '请输入新名称' })
      : t('popup:custom_point.rename_tip', { defaultValue: '请输入新名称' });

    const newName = await alertApi.prompt({
      content,
      defaultValue: currentName,
    });

    if (newName && newName !== currentName) {
      if (isElectricPole) {
        await service.dataService.mapDataService.electricPoleDataService.renameNode(
          entity.mapId,
          entity.id,
          newName,
        );
        return;
      }
      if (isCustomPoint) {
        await service.dataService.mapDataService.customPointDataService.renameNode(
          entity.mapId,
          entity.id,
          newName,
        );
        return;
      }
    }
  };

  return (
    <Pressable
      className="items-center justify-center rounded-lg p-2"
      onPress={handleRename}
      accessibilityLabel={t('common:operate.rename', { defaultValue: '重命名' })}
    >
      <MaterialIcons name="edit" size={22} color="#999" />
    </Pressable>
  );
});
