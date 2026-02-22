import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter';

export const ZoomControls = observer(function ZoomControls() {
  const adapter = useAdapter();
  const mapController = adapter.mapController;
  const view = mapController.view;
  const zoomConfig = mapController.zoomConfig;

  // Local target zoom ref — immune to syncFromMap overwrites during animation.
  const targetZoom = useRef<number | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      targetZoom.current = null;
    }, 500);
  }, []);

  const handleZoomIn = useCallback(() => {
    const base = targetZoom.current ?? view.currentZoom ?? zoomConfig.default;
    const next = Math.min(Math.round(base) + 1, zoomConfig.max);
    targetZoom.current = next;
    view.animate({ zoom: next, duration: 300 });
    scheduleReset();
  }, [view, zoomConfig, scheduleReset]);

  const handleZoomOut = useCallback(() => {
    const base = targetZoom.current ?? view.currentZoom ?? zoomConfig.default;
    const next = Math.max(Math.round(base) - 1, zoomConfig.min);
    targetZoom.current = next;
    view.animate({ zoom: next, duration: 300 });
    scheduleReset();
  }, [view, zoomConfig, scheduleReset]);

  return (
    <View className="absolute right-4 bottom-[110px] overflow-hidden rounded-[10px] bg-bg-glass shadow-md shadow-black/15 elevation-4">
      <Pressable className="h-11 w-11 items-center justify-center" onPress={handleZoomIn}>
        <Text className="text-[22px] font-normal leading-6 text-text-secondary">+</Text>
      </Pressable>
      <View className="mx-2 h-px bg-border-default" />
      <Pressable className="h-11 w-11 items-center justify-center" onPress={handleZoomOut}>
        <Text className="text-[22px] font-normal leading-6 text-text-secondary">−</Text>
      </Pressable>
    </View>
  );
});
