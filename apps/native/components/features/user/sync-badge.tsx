import { SyncStatus } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { service } from '@/services/map-service';

const STATUS_CONFIG: Record<SyncStatus, { color: string; labelKey: string; defaultLabel: string }> = {
  [SyncStatus.Idle]: { color: '#22c55e', labelKey: 'user.sync.state.idle', defaultLabel: '已同步' },
  [SyncStatus.Syncing]: { color: '#3b82f6', labelKey: 'user.sync.state.syncing', defaultLabel: '同步中...' },
  [SyncStatus.Error]: { color: '#ef4444', labelKey: 'user.sync.state.error', defaultLabel: '同步错误' },
  [SyncStatus.Offline]: { color: '#9ca3af', labelKey: 'user.sync.state.offline', defaultLabel: '离线' },
};

export const SyncBadge = observer(function SyncBadge() {
  const { t } = useTranslation('header');
  const status = service.userService.data.syncService.status;
  const config = STATUS_CONFIG[status];

  return (
    <View className="flex-row items-center gap-1.5">
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: config.color }}
      />
      <Text style={{ color: config.color }} className="text-xs font-medium">
        {t(config.labelKey, { defaultValue: config.defaultLabel })}
      </Text>
    </View>
  );
});
