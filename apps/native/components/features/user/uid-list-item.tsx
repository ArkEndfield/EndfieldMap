import type { UidInfo } from '@endfieldmap/map-service';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@endfieldmap/tools';

interface UidListItemProps {
  uid: UidInfo;
  isActive: boolean;
  onSwitch: (uid: string) => void;
  onUnbind: (uid: string) => void;
}

export function UidListItem({ uid, isActive, onSwitch, onUnbind }: UidListItemProps) {
  const { t } = useTranslation('header');
  const label = uid.is_default
    ? t('user.uid.default', { defaultValue: '默认' })
    : `UID ${uid.uid}`;

  return (
    <View
      className={cn(
        'mb-2 flex-row items-center rounded-xl px-3 py-3',
        isActive ? 'border border-primary bg-primary/10' : 'bg-bg-primary',
      )}
    >
      <View className="mr-3 h-5 w-5 items-center justify-center rounded-full border-2 border-border">
        {isActive ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </View>

      {uid.avatar ? (
        <Image
          source={{ uri: uid.avatar }}
          className="mr-3 h-9 w-9 rounded-full"
          resizeMode="cover"
        />
      ) : (
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-bg-secondary">
          <Text className="text-xs text-text-muted">N/A</Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="text-sm font-medium text-text-primary">{label}</Text>
        {uid.nickname ? (
          <Text className="mt-0.5 text-xs text-text-muted">{uid.nickname}</Text>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        {!isActive ? (
          <Pressable
            className="rounded-md bg-primary/15 px-3 py-1.5"
            onPress={() => onSwitch(uid.uid)}
          >
            <Text className="text-xs font-medium text-primary">
              {t('user.uid.switch', { defaultValue: '切换' })}
            </Text>
          </Pressable>
        ) : null}
        {!uid.is_default ? (
          <Pressable
            className="rounded-md bg-error/15 px-3 py-1.5"
            onPress={() => onUnbind(uid.uid)}
          >
            <Text className="text-xs font-medium text-error">
              {t('user.uid.delete', { defaultValue: '解绑' })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
