import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';
import { cn } from '@/utils/style';

const deviceKeys: ElectricPoleDeviceKey[] = ['pole', 'repeater', 'zipline_80', 'zipline_110'];

export const PoleTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const adapter = useAdapter();
  const entityImageBase = adapter.asset.entityImage;
  const selectedType = service.dataService.mapDataService.electricPoleDataService.creatingDeviceKey;

  const handleSelectType = (deviceKey: ElectricPoleDeviceKey) => {
    service.dataService.mapDataService.electricPoleDataService.setCreatingDeviceKey(deviceKey);
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-1"
      >
        {deviceKeys.map((key) => {
          const config = ELECTRIC_POLE_DEVICE_CONFIGS[key];
          const isActive = selectedType === key;
          const iconUri = `${entityImageBase}/${config.iconPic}.png`;
          return (
            <Pressable
              key={key}
              onPress={() => handleSelectType(key)}
              className={cn(
                'flex-row items-center gap-2 rounded-full px-3 py-1.5',
                isActive ? 'bg-white/25' : 'bg-black/40',
              )}
            >
              <View
                className={cn(
                  'h-7 w-7 items-center justify-center overflow-hidden rounded',
                  isActive ? 'border border-[#FCF250]' : 'border border-white/30',
                )}
              >
                <Image source={{ uri: iconUri }} className="h-full w-full" resizeMode="contain" />
              </View>
              <View>
                <Text className="text-xs font-medium text-white">
                  {t(`operation.electric_pole.create.device_type.options.${key}`, { defaultValue: config.name })}
                </Text>
                <Text className="text-[10px] text-white/60">{config.rangeMeters}M</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});
