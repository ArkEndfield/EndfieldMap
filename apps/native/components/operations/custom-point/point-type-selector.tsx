import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { customPointTypes } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';
import { cn } from '@endfieldmap/tools';

export const PointTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('common');
  const adapter = useAdapter();
  const entityImageBase = adapter.asset.entityImage;
  const selectedType = service.dataService.mapDataService.customPointDataService.selectedPointType;

  const handleSelectType = (pointType: CustomPointTypeId) => {
    service.dataService.mapDataService.customPointDataService.setSelectedPointType(pointType);
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-1"
      >
        {customPointTypes.map((type) => {
          const isActive = selectedType === type.id;
          const iconUri = `${entityImageBase}/${type.icon}.png`;
          return (
            <Pressable
              key={type.id}
              onPress={() => handleSelectType(type.id)}
              className={cn(
                'items-center rounded-lg p-1.5',
                isActive ? 'bg-white/25' : 'bg-black/40',
              )}
            >
              <View
                className={cn(
                  'h-9 w-9 overflow-hidden rounded',
                  isActive ? 'border-2 border-[#FCF250]' : 'border border-white/30',
                )}
              >
                <Image source={{ uri: iconUri }} className="h-full w-full" resizeMode="contain" />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});
