import type { PresetStoreResponseItem, PresetStoreTab } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { CustomPointStore } from '@/components/features/preset-store/custom-point-store';
import { ElectricPoleStore } from '@/components/features/preset-store/electric-pole-store';
import { MineStore } from '@/components/features/preset-store/mine';

const TAB_CONFIG: { key: PresetStoreTab; labelKey: string }[] = [
  { key: 'electric_pole', labelKey: 'sidebar:operation.electric_pole.preset.title' },
  { key: 'custom_point', labelKey: 'sidebar:operation.custom_point.preset.title' },
  { key: 'mine', labelKey: 'sidebar:preset_store.mine' },
];

export default function PresetStoreScreen() {
  const { t } = useTranslation(['sidebar']);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIdx, setActiveIdx] = useState(0);

  const activeTab = TAB_CONFIG[activeIdx].key;

  const handleTabPress = useCallback(
    (idx: number) => {
      scrollRef.current?.scrollTo({ x: idx * width, animated: true });
      setActiveIdx(idx);
    },
    [width],
  );

  const handleMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIdx(idx);
    },
    [width],
  );

  const handleOpen = useCallback(
    (item: PresetStoreResponseItem) => {
      router.push({
        pathname: '/preset-store-detail',
        params: { id: String(item.id) },
      });
    },
    [router],
  );

  const tabWidth = width / TAB_CONFIG.length;
  const indicatorX = scrollX.interpolate({
    inputRange: TAB_CONFIG.map((_, i) => i * width),
    outputRange: TAB_CONFIG.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-bg-secondary pt-[50px]">
      {/* Tab bar */}
      <View className="bg-bg-secondary">
        <View className="flex-row">
          {TAB_CONFIG.map(({ key, labelKey }, i) => (
            <Pressable
              key={key}
              className="flex-1 items-center py-3"
              onPress={() => handleTabPress(i)}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  i === activeIdx ? 'font-semibold text-primary' : 'text-text-muted',
                )}
              >
                {t(labelKey, { defaultValue: key })}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="h-0.5 bg-border-light">
          <Animated.View
            className="h-full rounded-full bg-primary"
            style={{ width: tabWidth, transform: [{ translateX: indicatorX }] }}
          />
        </View>
      </View>

      {/* Content with horizontal paging */}
      <Animated.ScrollView
        ref={scrollRef as React.RefObject<ScrollView>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        <View style={{ width }}>
          <ElectricPoleStore show={activeTab === 'electric_pole'} onOpen={handleOpen} />
        </View>
        <View style={{ width }}>
          <CustomPointStore show={activeTab === 'custom_point'} onOpen={handleOpen} />
        </View>
        <View style={{ width }}>
          <MineStore show={activeTab === 'mine'} onOpen={handleOpen} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
