import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointDataInstance, CustomPointKey, customPointTypes } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';

interface CustomPointSelectProps {
  instance: CustomPointDataInstance;
}

export function CustomPointSelect({ instance }: CustomPointSelectProps) {
  const { t } = useTranslation(['popup', 'common']);
  const adapter = useAdapter();

  const handleChangeType = useCallback(
    async (newType: CustomPointTypeId) => {
      try {
        await service.dataService.mapDataService.customPointDataService.changePointType(
          instance.mapId,
          instance.id,
          newType,
        );
      } catch (error) {
        console.error('Failed to change point type:', error);
      }
    },
    [instance.mapId, instance.id],
  );

  const getIconUri = (icon: string) =>
    `${adapter.asset.entityImage}/${icon}.png`;

  return (
    <View className="mt-3">
      <Text className="mb-1.5 text-xs text-text-muted">
        {t('popup:custom_point.change_type', { defaultValue: '切换标点类型' })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        {customPointTypes.map((type) => {
          const isSelected = instance.typeId === type.id;
          return (
            <Pressable
              key={type.id}
              className={cn(
                'mr-2 items-center rounded-lg border px-3 py-2',
                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-bg-tertiary',
              )}
              onPress={() => handleChangeType(type.id)}
            >
              <Image source={{ uri: getIconUri(type.icon) }} className="mb-1 h-6 w-6" resizeMode="contain" />
              <Text
                className={cn('text-xs', isSelected ? 'font-semibold text-primary' : 'text-text-secondary')}
                numberOfLines={1}
              >
                {t(`common:custom_point.type.${type.id}`, { defaultValue: type.id })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
