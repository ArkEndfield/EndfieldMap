import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameMapView } from '@/components/map/game-map-view';
import { EntityFilterSheet, type EntityFilterSheetRef } from '@/components/ui/entity-filter-sheet';
import { EntityInfoSheet } from '@/components/ui/entity-info-sheet';
import { MapSwitcher } from '@/components/ui/map-switcher';
import { AdapterProvider } from '@/context/adapter';
import { useMapInit } from '@/hooks/use-map-init';

export default function MapScreen() {
  const { adapter, loading, error } = useMapInit();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载地图数据...</Text>
      </View>
    );
  }

  if (error || !adapter) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>加载失败</Text>
        <Text style={styles.errorDetail}>{error?.message ?? 'Unknown error'}</Text>
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
  const [activeEntity, setActiveEntity] = useState<EntityDataInstance | null>(null);
  const filterSheetRef = useRef<EntityFilterSheetRef>(null);

  const handleEntityPress = useCallback((instance: EntityDataInstance) => {
    setActiveEntity(instance);
  }, []);

  const handleDismissInfo = useCallback(() => {
    setActiveEntity(null);
  }, []);

  const handleOpenFilter = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  return (
    <View style={styles.container}>
      <GameMapView onEntityPress={handleEntityPress} />

      <MapSwitcher />

      <Pressable style={styles.filterFab} onPress={handleOpenFilter}>
        <Text style={styles.filterFabText}>筛选</Text>
      </Pressable>

      <EntityInfoSheet instance={activeEntity} onDismiss={handleDismissInfo} />
      <EntityFilterSheet ref={filterSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  filterFab: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  filterFabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});
