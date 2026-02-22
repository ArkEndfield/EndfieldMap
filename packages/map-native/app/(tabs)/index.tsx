import type { DataInstance } from '@endfieldmap/map-core/types/event';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GameMapView } from '@/components/map/game-map-view';
import { EntityFilterSheet, type EntityFilterSheetRef } from '@/components/ui/entity-filter-sheet';
import { EntityInfoSheet } from '@/components/ui/entity-info-sheet';
import { MapSwitcher } from '@/components/ui/map-switcher';
import { ZoomControls } from '@/components/ui/zoom-controls';
import { AdapterProvider } from '@/context/adapter';
import { useMapInit } from '@/hooks/use-map-init';

export default function MapScreen() {
  const { t } = useTranslation('common');
  const { adapter, loading, error } = useMapInit();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-[15px] text-text-tertiary">{t('common:loading', { defaultValue: '加载中...' })}</Text>
      </View>
    );
  }

  if (error || !adapter) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <Text className="mb-2 text-lg font-semibold text-error">{t('common:load_error', { defaultValue: '加载失败' })}</Text>
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
  const [activeEntity, setActiveEntity] = useState<DataInstance | null>(null);
  const filterSheetRef = useRef<EntityFilterSheetRef>(null);

  const handleEntityPress = useCallback((instance: EntityDataInstance) => {
    setActiveEntity(instance as DataInstance);
  }, []);

  const handleDismissInfo = useCallback(() => {
    setActiveEntity(null);
  }, []);

  const handleOpenFilter = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1">
      <GameMapView onEntityPress={handleEntityPress} />

      <MapSwitcher />
      <ZoomControls />

      <Pressable
        className="absolute bottom-10 right-4 rounded-3xl bg-bg-glass px-5 py-3 shadow-md shadow-black/15 elevation-4"
        onPress={handleOpenFilter}
      >
        <Text className="text-[15px] font-semibold text-primary">{t('header:head_menu.filter', { defaultValue: '筛选' })}</Text>
      </Pressable>

      <EntityInfoSheet instance={activeEntity} onDismiss={handleDismissInfo} />
      <EntityFilterSheet ref={filterSheetRef} />
    </View>
  );
}
