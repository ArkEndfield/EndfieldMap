import { cn } from '@endfieldmap/tools';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, Text, useAnimatedValue, useWindowDimensions, View } from 'react-native';

import { AboutPage } from '@/components/features/settings/items/about';
import { DataSettings } from '@/components/features/settings/items/data';
import { DisplaySettings } from '@/components/features/settings/items/display';
import { MapSettings } from '@/components/features/settings/items/map';
import { SETTINGS_PAGE } from '@/const/settings';

const settingList = [
  { key: SETTINGS_PAGE.GENERAL, Component: MapSettings },
  { key: SETTINGS_PAGE.DISPLAY, Component: DisplaySettings },
  { key: SETTINGS_PAGE.DATA, Component: DataSettings },
  { key: SETTINGS_PAGE.ABOUT, Component: AboutPage },
] as const;

function useTabLabels() {
  const { t } = useTranslation('settings');
  return {
    [SETTINGS_PAGE.GENERAL]: t('map.title'),
    [SETTINGS_PAGE.DISPLAY]: t('display.language.title'),
    [SETTINGS_PAGE.DATA]: t('data.title'),
    [SETTINGS_PAGE.ABOUT]: t('about.title'),
  };
}

export default function SettingsScreen() {
  const { t } = useTranslation(['header', 'settings']);
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ tab?: string; item?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useAnimatedValue(0);
  const tabLabels = useTabLabels();

  const initialIdx = params.tab
    ? Math.max(settingList.findIndex((s) => s.key === params.tab), 0)
    : 0;
  const [activeIdx, setActiveIdx] = useState(initialIdx);

  useEffect(() => {
    if (initialIdx > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialIdx * width, animated: false });
      }, 50);
    }
  }, [initialIdx, width]);

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

  return (
    <>
      <Stack.Screen options={{ title: t('header:settings.title') }} />
      <View className="flex-1 bg-bg-secondary">
        <TabBar
          activeIdx={activeIdx}
          labels={tabLabels}
          scrollX={scrollX}
          pageWidth={width}
          onPress={handleTabPress}
        />
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
          {settingList.map(({ key, Component }) => (
            <View key={key} style={{ width }}>
              <Component />
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    </>
  );
}

function TabBar({
  activeIdx,
  labels,
  scrollX,
  pageWidth,
  onPress,
}: {
  activeIdx: number;
  labels: Record<string, string>;
  scrollX: Animated.Value;
  pageWidth: number;
  onPress: (idx: number) => void;
}) {
  const tabWidth = pageWidth / settingList.length;

  const indicatorX = scrollX.interpolate({
    inputRange: settingList.map((_, i) => i * pageWidth),
    outputRange: settingList.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View className="bg-bg-secondary">
      <View className="flex-row">
        {settingList.map(({ key }, i) => (
          <Pressable key={key} className="flex-1 items-center py-3" onPress={() => onPress(i)}>
            <Text
              className={cn(
                'text-sm font-medium',
                i === activeIdx ? 'font-semibold text-primary' : 'text-text-muted',
              )}
            >
              {labels[key]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="h-0.5 bg-border">
        <Animated.View
          className="h-full rounded-full bg-primary"
          style={{ width: tabWidth, transform: [{ translateX: indicatorX }] }}
        />
      </View>
    </View>
  );
}
