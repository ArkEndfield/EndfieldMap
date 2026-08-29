import type { DataInstance } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

import { LeftContent } from './left-content';
import { RightContent } from './right-content';
import { getRightComponents } from './right-content/items';

const TAB_KEYS = ['entity', 'reward'] as const;

function EntityTabBar({
  activeIdx,
  scrollX,
  pageWidth,
  onPress,
}: {
  activeIdx: number;
  scrollX: Animated.Value;
  pageWidth: number;
  onPress: (idx: number) => void;
}) {
  const { t } = useTranslation('popup');
  const tabWidth = pageWidth / TAB_KEYS.length;

  const indicatorX = scrollX.interpolate({
    inputRange: TAB_KEYS.map((_, i) => i * pageWidth),
    outputRange: TAB_KEYS.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  const labels = [
    t('entity.title', { defaultValue: '实体' }),
    t('reward.title', { defaultValue: '奖励' }),
  ];

  return (
    <View className="mx-4 mb-2">
      <View className="flex-row rounded-lg bg-bg-tertiary">
        {TAB_KEYS.map((key, i) => (
          <Pressable key={key} className="flex-1 items-center py-2.5" onPress={() => onPress(i)}>
            <Text
              className={cn(
                'text-sm font-medium',
                i === activeIdx ? 'font-semibold text-primary' : 'text-text-muted',
              )}
            >
              {labels[i]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-0.5 h-0.5 rounded-full bg-border-light">
        <Animated.View
          className="h-full rounded-full bg-primary"
          style={{ width: tabWidth, transform: [{ translateX: indicatorX }] }}
        />
      </View>
    </View>
  );
}

interface EntityInfoSheetProps {
  instance: DataInstance | null;
  onDismiss: () => void;
}

export const EntityInfoSheet = observer(function EntityInfoSheet({
  instance,
  onDismiss,
}: EntityInfoSheetProps) {
  const adapter = useAdapter();
  const sheetRef = useRef<TrueSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIdx, setActiveIdx] = useState(0);
  const openTimeRef = useRef(0);

  const open =
    !!instance &&
    !service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode &&
    !service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode;

  const entity = instance?.data;
  const subPopupItems = getRightComponents(entity);
  const showSubPopup = subPopupItems.length > 0;

  useEffect(() => {
    if (open) {
      sheetRef.current?.present().catch(() => {});
      openTimeRef.current = Date.now();
    } else {
      sheetRef.current?.dismiss().catch(() => {});
    }
  }, [open]);

  // Reset tab when entity changes (matches web: setShowSubPage(false))
  useEffect(() => {
    setActiveIdx(0);
    scrollX.setValue(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [instance, scrollX]);

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

  const handleDismiss = useCallback(() => {
    if (Date.now() - openTimeRef.current < 400) return;
    adapter.activeFeatureController.clearActiveFeature();
    onDismiss();
  }, [adapter, onDismiss]);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto', 1]}
      cornerRadius={16}
      grabber
      onDidDismiss={handleDismiss}
    >
      {instance ? (
        <View className="min-h-[320px]">
          {showSubPopup ? (
            <EntityTabBar
              activeIdx={activeIdx}
              scrollX={scrollX}
              pageWidth={width}
              onPress={handleTabPress}
            />
          ) : null}

          {showSubPopup ? (
            <Animated.ScrollView
              ref={scrollRef as React.RefObject<ScrollView>}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false },
              )}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleMomentumEnd}
              className="flex-1"
            >
              <View style={{ width }}>
                <LeftContent entity={instance} />
              </View>
              <View style={{ width }}>
                <RightContent items={subPopupItems} />
              </View>
            </Animated.ScrollView>
          ) : (
            <LeftContent entity={instance} />
          )}
        </View>
      ) : (
        <View className="h-px" />
      )}
    </TrueSheet>
  );
});
