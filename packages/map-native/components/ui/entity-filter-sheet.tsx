import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { CustomPointKey, ElectricPoleKey, NoteKey } from '@endfieldmap/map-core/const/map';
import type { EntityInfoStats } from '@endfieldmap/map-core/types/entity';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';

export interface EntityFilterSheetRef {
  present: () => void;
  dismiss: () => void;
}

function getEntityDisplayName(
  stat: EntityInfoStats,
  t: (key: string, opts?: { defaultValue?: string }) => string
): string {
  const category = stat.category;

  if (category === ElectricPoleKey) {
    return t(`sidebar:operation.electric_pole.create.device_type.options.${stat.entityDataIdKey}`, {
      defaultValue: stat.entityDataIdKey,
    });
  }
  if (category === CustomPointKey) {
    return t(`common:custom_point.type.${stat.entityDataIdKey}`, {
      defaultValue: stat.entityDataIdKey,
    });
  }
  if (category === NoteKey) {
    return t(`lang:${stat.entityDataIdKey}`, { defaultValue: stat.entityDataIdKey });
  }

  const hash = service.langHashService.getHash(stat.entityDataIdKey);
  return t(`lang:${hash}`, { defaultValue: stat.entityDataIdKey });
}

function getCategoryName(
  category: string,
  t: (key: string, opts?: { defaultValue?: string }) => string
): string {
  return t(`sidebar:filter.category.${category}`, { defaultValue: category });
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const EntityFilterSheet = observer(
  forwardRef<EntityFilterSheetRef>(function EntityFilterSheet(_props, ref) {
    const { t } = useTranslation(['sidebar', 'common', 'lang']);
    const adapter = useAdapter();
    const sheetRef = useRef<TrueSheet>(null);
    const entityController = adapter.entityController;
    const stats = entityController.currentStats;
    const currentFilterMode = entityController.dataManager.markedFilterMode;

    useImperativeHandle(ref, () => ({
      present: () => { sheetRef.current?.present().catch(() => {}); },
      dismiss: () => { sheetRef.current?.dismiss().catch(() => {}); },
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

    const handleShowAll = useCallback(() => {
      entityController.setAllEntityVisible(true);
    }, [entityController]);

    const handleHideAll = useCallback(() => {
      entityController.setAllEntityVisible(false);
    }, [entityController]);

    const groupedStats = useMemo(() => {
      const groups: Array<{ category: string; stats: EntityInfoStats[] }> = [];
      const map = new Map<string, EntityInfoStats[]>();
      for (const stat of stats) {
        const key = stat.category;
        const existing = map.get(key);
        if (existing) {
          existing.push(stat);
        } else {
          const arr = [stat];
          map.set(key, arr);
          groups.push({ category: key, stats: arr });
        }
      }
      return groups;
    }, [stats]);

    return (
      <TrueSheet
        ref={sheetRef}
        sizes={['90%']}
        cornerRadius={16}
        grabber
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('sidebar:filter.title', { defaultValue: '标点筛选' })}</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton} onPress={handleShowAll}>
                <Text style={styles.headerButtonText}>{t('common:select_all', { defaultValue: '全选' })}</Text>
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleHideAll}>
                <Text style={styles.headerButtonText}>{t('sidebar:filter.reset', { defaultValue: '重置' })}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.filterModeBar}>
            {([
              [MarkedFeatureFilterMode.All, t('sidebar:filter.all', { defaultValue: '全部' })],
              [MarkedFeatureFilterMode.Unmarked, t('sidebar:filter.unmarked', { defaultValue: '未标记' })],
              [MarkedFeatureFilterMode.Marked, t('sidebar:filter.marked', { defaultValue: '已标记' })],
            ] as const).map(([mode, label]) => (
              <Pressable
                key={mode}
                style={[styles.filterButton, currentFilterMode === mode && styles.filterButtonActive]}
                onPress={() => handleFilterModeChange(mode as MarkedFeatureFilterMode)}
              >
                <Text style={[styles.filterButtonText, currentFilterMode === mode && styles.filterButtonTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {groupedStats.map(({ category, stats: categoryStats }) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{getCategoryName(category, t)}</Text>
                {categoryStats.map((stat) => (
                  <EntityGroupRowInner
                    key={stat.uniqueKey}
                    stat={stat}
                    displayName={getEntityDisplayName(stat, t)}
                    entityImageBase={adapter.asset.entityImage}
                    onToggle={() => handleToggleVisibility(stat)}
                  />
                ))}
              </View>
            ))}
            {stats.length === 0 && (
              <Text style={styles.emptyText}>{t('sidebar:filter.empty', { defaultValue: '当前地图无标点数据' })}</Text>
            )}
          </ScrollView>
        </View>
      </TrueSheet>
    );
  })
);

const EntityGroupRowInner = observer(function EntityGroupRowInner({
  stat,
  displayName,
  entityImageBase,
  onToggle,
}: {
  stat: EntityInfoStats;
  displayName: string;
  entityImageBase: string;
  onToggle: () => void;
}) {
  const name = displayName;
  const iconUrl = stat.entityInfo?.pic
    ? `${entityImageBase}/${stat.entityInfo.pic}.png`
    : null;
  const markedCount = stat.markedCount ?? 0;
  const total = stat.count;
  const progressPercent = total > 0 ? (markedCount / total) * 100 : 0;

  return (
    <Pressable style={styles.groupRow} onPress={onToggle}>
      <View style={styles.groupLeft}>
        <View style={[styles.visibilityDot, !stat.visible && styles.visibilityDotHidden]} />
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.groupIcon} resizeMode="contain" />
        ) : (
          <View style={styles.groupIconPlaceholder} />
        )}
        <Text style={[styles.groupName, !stat.visible && styles.groupNameHidden]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.groupRight}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
        </View>
        <Text style={styles.groupCount}>
          {markedCount}/{total}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  headerButtonText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterModeBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  filterButtonTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  categorySection: { marginBottom: 16 },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  groupLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  visibilityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  visibilityDotHidden: { backgroundColor: '#ccc' },
  groupIcon: { width: 24, height: 24, borderRadius: 4 },
  groupIconPlaceholder: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#e0e0e0' },
  groupName: { fontSize: 14, color: '#333', flex: 1 },
  groupNameHidden: { color: '#aaa' },
  groupRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  progressBarBg: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2, backgroundColor: '#4CAF50' },
  groupCount: { fontSize: 12, color: '#888', minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
});
