import type { DataInstance } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { service } from '@/services/map-service';

interface MarkButtonProps {
  entity: DataInstance;
}

export const MarkButton = observer(function MarkButton({ entity }: MarkButtonProps) {
  const { t } = useTranslation('common');

  if (!entity?.markable) return null;

  const handleMark = () => {
    service.dataService.mapDataService.entityDataService.markEntity(
      entity.mapId,
      entity.id,
      !entity.marked,
    );
  };

  return (
    <Pressable
      className={cn('items-center justify-center rounded-lg p-2', entity.marked && 'bg-yellow-500/10')}
      onPress={handleMark}
      accessibilityLabel={
        entity.marked
          ? t('operate.unmark', { defaultValue: '取消标记' })
          : t('operate.mark', { defaultValue: '标记完成' })
      }
    >
      <MaterialIcons
        name={entity.marked ? 'check-circle' : 'check-circle-outline'}
        size={22}
        color={entity.marked ? '#fffa00' : '#999'}
      />
    </Pressable>
  );
});
