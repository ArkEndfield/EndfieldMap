import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleDataInstance, ElectricPoleKey } from '@endfieldmap/map-core';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { alertApi } from '@/components/ui/alert/alert-api';
import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

interface DeleteButtonProps {
  entity: DataInstance;
}

export const DeleteButton = observer(function DeleteButton({ entity }: DeleteButtonProps) {
  const { t } = useTranslation('common');
  const adapter = useAdapter();

  const isCustomPoint = entity.entityInfo?.category === CustomPointKey;
  const isElectricPole = entity.entityInfo?.category === ElectricPoleKey;

  if (!isCustomPoint && !isElectricPole) return null;

  const handleDelete = async () => {
    const confirmed = await alertApi.confirm({
      content: t('operate.delete_confirm', { defaultValue: '确认删除？' }),
    });
    if (!confirmed) return;

    if (isCustomPoint) {
      service.dataService.mapDataService.customPointDataService.deleteCustomPoint(
        adapter.mapController.dataManager.currentMapId,
        entity.id,
      );
    } else if (isElectricPole) {
      service.dataService.mapDataService.electricPoleDataService.deleteElectricPole(
        entity as ElectricPoleDataInstance,
        true,
      );
    }

    adapter.activeFeatureController.clearActiveFeature?.();
  };

  return (
    <Pressable
      className="items-center justify-center rounded-lg p-2"
      onPress={handleDelete}
      accessibilityLabel={t('delete', { defaultValue: '删除' })}
    >
      <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
    </Pressable>
  );
});
