import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import type { EntityInfoStats } from '@endfieldmap/map-core/types/entity';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useImperativeHandle, useRef, forwardRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter';

export interface EntityFilterSheetRef {
  present: () => void;
  dismiss: () => void;
}

/**
 * 标点筛选 BottomSheet
 * 显示当前地图的实体分类列表，支持切换可见性和标记过滤
 */
export const EntityFilterSheet = observer(
  forwardRef<EntityFilterSheetRef>(function EntityFilterSheet(_props, ref) {
    const adapter = useAdapter();
    const sheetRef = useRef<TrueSheet>(null);

    const entityController = adapter.entityController;
    const stats = entityController.currentStats;
    const currentFilterMode = entityController.dataManager.markedFilterMode;

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleToggleVisibility = useCallback(
      (stat: EntityInfoStats) => {
        if (!stat.mapId) return;
        entityController.setGroupVisibility(stat.mapId, stat.entityDataIdKey, !stat.visible);
      },
      [entityController]
    );

    const handleFilterModeChange = useCallback(
      (mode: MarkedFeatureFilterMode) => {
        entityController.setMarkedFilterMode(mode);
      },
      [entityController]
    );

    return (
      <TrueSheet
        ref={sheetRef}
        cornerRadius={16}
        grabber
      >
        <View style={styles.container}>
          <Text style={styles.title}>标点筛选</Text>

          <View style={styles.filterModeBar}>
            <FilterModeButton
              label="全部"
              active={currentFilterMode === MarkedFeatureFilterMode.All}
              onPress={() => handleFilterModeChange(MarkedFeatureFilterMode.All)}
            />
            <FilterModeButton
              label="未标记"
              active={currentFilterMode === MarkedFeatureFilterMode.Unmarked}
              onPress={() => handleFilterModeChange(MarkedFeatureFilterMode.Unmarked)}
            />
            <FilterModeButton
              label="已标记"
              active={currentFilterMode === MarkedFeatureFilterMode.Marked}
              onPress={() => handleFilterModeChange(MarkedFeatureFilterMode.Marked)}
            />
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {stats.map((stat) => (
              <EntityGroupRow
                key={stat.uniqueKey}
                stat={stat}
                onToggle={() => handleToggleVisibility(stat)}
              />
            ))}
            {stats.length === 0 && (
              <Text style={styles.emptyText}>当前地图无标点数据</Text>
            )}
          </ScrollView>
        </View>
      </TrueSheet>
    );
  })
);

function FilterModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const EntityGroupRow = observer(function EntityGroupRow({
  stat,
  onToggle,
}: {
  stat: EntityInfoStats;
  onToggle: () => void;
}) {
  const markedText =
    stat.markedCount !== undefined ? `${stat.markedCount}/${stat.count}` : `${stat.count}`;

  return (
    <Pressable style={styles.groupRow} onPress={onToggle}>
      <View style={styles.groupInfo}>
        <View style={[styles.visibilityDot, !stat.visible && styles.visibilityDotHidden]} />
        <Text style={[styles.groupName, !stat.visible && styles.groupNameHidden]} numberOfLines={1}>
          {stat.entityDataIdKey}
        </Text>
      </View>
      <Text style={styles.groupCount}>{markedText}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  filterModeBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  visibilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  visibilityDotHidden: {
    backgroundColor: '#ccc',
  },
  groupName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  groupNameHidden: {
    color: '#aaa',
  },
  groupCount: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 15,
  },
});
