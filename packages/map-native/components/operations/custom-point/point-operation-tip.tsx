import { observer } from 'mobx-react-lite';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { OperationTip } from '@/components/operations/operation-tip';
import { useCustomPointMode } from '@/hooks/use-custom-point-mode';
import { useMobxSource } from '@/hooks/use-mobx-source';
import { service } from '@/services/map-service';

import { PointTypeSelector } from './point-type-selector';

export const PointOperationTip: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const insets = useSafeAreaInsets();
  const { getCurrentMode, getCurrentModeTipText, stopAllModes } = useCustomPointMode();

  const isCreating = useMobxSource(() => service.dataService.mapDataService.customPointDataService.isCreating);
  const isDeleting = useMobxSource(() => service.dataService.mapDataService.customPointDataService.isDeleting);

  const currentMode = getCurrentMode();
  const tipTextKey = getCurrentModeTipText();
  const isInAnyMode = isCreating || isDeleting;

  if (!isInAnyMode) return null;

  const tipText = tipTextKey
    ? t(`operation.custom_point.${tipTextKey}.in_mode`, { defaultValue: '操作模式中' })
    : '';

  return (
    <View
      className="absolute left-0 right-0 z-10 items-center gap-2 px-4"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      <View onStartShouldSetResponder={() => true}>
        <OperationTip open={isInAnyMode} onClose={stopAllModes}>
          <Text className="text-center text-sm text-white">{tipText}</Text>
        </OperationTip>
      </View>

      {currentMode === 'isCreating' && (
        <View onStartShouldSetResponder={() => true}>
          <PointTypeSelector />
        </View>
      )}
    </View>
  );
});
