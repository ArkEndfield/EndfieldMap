import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleZoomIn}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
      <View style={styles.divider} />
      <Pressable style={styles.button} onPress={handleZoomOut}>
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#333',
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
});
