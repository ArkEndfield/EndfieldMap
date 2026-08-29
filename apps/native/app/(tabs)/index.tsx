import { useMobxSource } from '@endfieldmap/map-hooks';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EntityInfoSheet } from '@/components/features/entity-info';
import { GameMapView } from '@/components/map/game-map-view';
import { CustomPointSheet, type CustomPointSheetRef } from '@/components/operations/custom-point/custom-point-sheet';
import { PointOperationTip } from '@/components/operations/custom-point/point-operation-tip';
import {
  ElectricPoleSheet,
  type ElectricPoleSheetRef,
} from '@/components/operations/electric-pole/electric-pole-sheet';
import { PoleOperationTip } from '@/components/operations/electric-pole/pole-operation-tip';
import { EntityFilterSheet, type EntityFilterSheetRef } from '@/components/ui/entity-filter-sheet';
import { MapSwitcher } from '@/components/ui/map-switcher';
import { ZoomControls } from '@/components/ui/zoom-controls';
import { AdapterProvider } from '@/context/adapter';
import { useAdapter } from '@/context/adapter-context';
import { useMapInit } from '@/hooks/use-map-init';

export default function MapScreen() {
  const { t } = useTranslation('common');
  const { adapter, loading, error } = useMapInit();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-[15px] text-text-tertiary">
          {t('common:loading', { defaultValue: '加载中...' })}
        </Text>
      </View>
    );
  }

  if (error || !adapter) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <Text className="mb-2 text-lg font-semibold text-error">
          {t('common:load_error', { defaultValue: '加载失败' })}
        </Text>
        <Text className="px-10 text-center text-[13px] text-text-placeholder">{error?.message ?? 'Unknown error'}</Text>
      </View>
    );
  }

  return (
    <AdapterProvider adapter={adapter}>
      <MapContent />
    </AdapterProvider>
  );
}

function MapContent() {
  const { t } = useTranslation(['common', 'header']);
  const adapter = useAdapter();
  const activeEntity = useMobxSource(() => adapter.activeFeatureController.activeFeature ?? null);
  const filterSheetRef = useRef<EntityFilterSheetRef>(null);
  const customPointSheetRef = useRef<CustomPointSheetRef>(null);
  const electricPoleSheetRef = useRef<ElectricPoleSheetRef>(null);

  const handleDismissInfo = useCallback(() => {
    adapter.activeFeatureController.clearActiveFeature();
  }, [adapter]);

  const handleOpenFilter = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  const handleOpenCustomPoint = useCallback(() => {
    customPointSheetRef.current?.present();
  }, []);

  const handleOpenElectricPole = useCallback(() => {
    electricPoleSheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1">
      <GameMapView />

      <PoleOperationTip />
      <PointOperationTip />

      <MapSwitcher />
      <ZoomControls />

      <View className="absolute bottom-28 right-4 gap-2">
        <Pressable
          className="rounded-3xl bg-bg-glass px-5 py-3 shadow-md shadow-black/15 elevation-4"
          onPress={handleOpenCustomPoint}
        >
          <Text className="text-[15px] font-semibold text-primary">
            {t('header:head_menu.custom', { defaultValue: '自定义标点' })}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-3xl bg-bg-glass px-5 py-3 shadow-md shadow-black/15 elevation-4"
          onPress={handleOpenElectricPole}
        >
          <Text className="text-[15px] font-semibold text-primary">
            {t('header:head_menu.poles', { defaultValue: '电线杆管理' })}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-3xl bg-bg-glass px-5 py-3 shadow-md shadow-black/15 elevation-4"
          onPress={handleOpenFilter}
        >
          <Text className="text-[15px] font-semibold text-primary">
            {t('header:head_menu.filter', { defaultValue: '资源标点筛选' })}
          </Text>
        </Pressable>
      </View>

      <EntityInfoSheet instance={activeEntity} onDismiss={handleDismissInfo} />
      <EntityFilterSheet ref={filterSheetRef} />
      <CustomPointSheet ref={customPointSheetRef} />
      <ElectricPoleSheet ref={electricPoleSheetRef} />
    </View>
  );
}
