import { useMobxSource } from '@endfieldmap/map-hooks';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OperationTip } from '@/components/operations/operation-tip';
import { useElectricPoleMode } from '@/hooks/use-electric-pole-mode';
import { service } from '@/services/map-service';

import { PoleTypeSelector } from './pole-type-selector';

export const PoleOperationTip: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const insets = useSafeAreaInsets();
  const { getCurrentMode, getCurrentModeTipText, stopAllModes } = useElectricPoleMode();

  const isCreating = useMobxSource(() => service.dataService.mapDataService.electricPoleDataService.isCreating);
  const isConnecting = useMobxSource(() => service.dataService.mapDataService.electricPoleDataService.isConnecting);
  const isDeleting = useMobxSource(() => service.dataService.mapDataService.electricPoleDataService.isDeleting);
  const isDeletingConnection = useMobxSource(
    () => service.dataService.mapDataService.electricPoleDataService.isDeletingConnection
  );

  const currentMode = getCurrentMode();
  const tipTextKey = getCurrentModeTipText();
  const isInAnyMode = isCreating || isConnecting || isDeleting || isDeletingConnection;

  if (!isInAnyMode) return null;

  const tipText = tipTextKey ? t(`operation.electric_pole.${tipTextKey}.in_mode`, { defaultValue: '操作模式中' }) : '';

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
          <PoleTypeSelector />
        </View>
      )}
    </View>
  );
});
