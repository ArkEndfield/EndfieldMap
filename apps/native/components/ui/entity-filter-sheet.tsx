import {
  customPointTypes,
  ELECTRIC_POLE_DEVICE_CONFIGS,
  type ElectricPoleDeviceKey,
  EntityInfoStats,
  getCustomPointEntityInfo,
  getElectricPoleDeviceConfig,
} from '@endfieldmap/map-core';
import {
  CustomPointKey,
  ElectricPoleIdKey,
  ElectricPoleKey,
  MarkedFeatureFilterMode,
  NoteKey,
} from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

export interface EntityFilterSheetRef {
  present: () => void;
  dismiss: () => void;
}

type FilterSource = 'entity' | 'custom_point' | 'electric_pole';

interface FilterStat extends EntityInfoStats {
  source: FilterSource;
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
const ELECTRIC_POLE_DEVICE_KEYS = Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS) as ElectricPoleDeviceKey[];

export const EntityFilterSheet = observer(
  forwardRef<EntityFilterSheetRef>(function EntityFilterSheet(_props, ref) {
    const { t } = useTranslation(['sidebar', 'common', 'lang']);
    const adapter = useAdapter();
    const sheetRef = useRef<TrueSheet>(null);
    const entityController = adapter.entityController;
    const mapId = adapter.mapController.dataManager.currentMapId;
    const entityStats = entityController.currentStats;
    const customPointInstances = adapter.customPointController.dataManager.currentManager.instances;
    const electricPoleInstances = adapter.electricPoleController.dataManager.currentInstances;
    const currentFilterMode = entityController.dataManager.markedFilterMode;

    const customPointStats: FilterStat[] = (() => {
      const countByType = new Map<string, number>();
      for (const instance of customPointInstances) {
        const typeId = instance.typeId;
        countByType.set(typeId, (countByType.get(typeId) ?? 0) + 1);
      }

      return customPointTypes.map((typeConfig): FilterStat => ({
        source: 'custom_point',
        uniqueKey: `${CustomPointKey}:${typeConfig.id}`,
        category: CustomPointKey,
        entityDataIdKey: typeConfig.id,
        entityInfo: getCustomPointEntityInfo(typeConfig.id).entityInfo,
        visible: adapter.customPointController.getTypeVisible(typeConfig.id),
        count: countByType.get(typeConfig.id) ?? 0,
        markedCount: 0,
        mapId,
      }));
    })();

    const electricPoleStats: FilterStat[] = (() => {
      const countByDevice = new Map<ElectricPoleDeviceKey, number>();
      for (const instance of electricPoleInstances) {
        const deviceKey = instance.deviceKey;
        countByDevice.set(deviceKey, (countByDevice.get(deviceKey) ?? 0) + 1);
      }

      return ELECTRIC_POLE_DEVICE_KEYS.map((deviceKey): FilterStat => {
        const config = getElectricPoleDeviceConfig(deviceKey);
        return {
          source: 'electric_pole',
          uniqueKey: `${ElectricPoleKey}:${deviceKey}`,
          category: ElectricPoleKey,
          entityDataIdKey: deviceKey,
          entityInfo: {
            point: ElectricPoleIdKey,
            pic: config.iconPic,
          },
          visible: adapter.electricPoleController.getDeviceVisible(deviceKey),
          count: countByDevice.get(deviceKey) ?? 0,
          markedCount: 0,
          mapId,
        };
      });
    })();

    const mergedStats: FilterStat[] = [
      ...customPointStats,
      ...electricPoleStats,
      ...entityStats.map((stat) => ({ ...stat, source: 'entity' as const })),
    ];

    useImperativeHandle(ref, () => ({
      present: () => { sheetRef.current?.present().catch(() => {}); },
      dismiss: () => { sheetRef.current?.dismiss().catch(() => {}); },
    }));

    const handleToggleVisibility = useCallback(
      (stat: FilterStat) => {
        if (!stat.mapId) return;
        const visible = !stat.visible;

        if (stat.source === 'custom_point') {
          void service.dataService.mapDataService.customPointDataService.updateItemVisibility(
            stat.mapId,
            stat.entityDataIdKey,
            visible
          ).catch(() => {});
          return;
        }

        if (stat.source === 'electric_pole') {
          void service.dataService.mapDataService.electricPoleDataService.updateItemVisibility(
            stat.mapId,
            stat.entityDataIdKey,
            visible
          ).catch(() => {});
          return;
        }

        service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(
          stat.mapId,
          stat.entityDataIdKey,
          visible
        );
      },
      []
    );

    const handleFilterModeChange = useCallback(
      (mode: MarkedFeatureFilterMode) => {
        entityController.setMarkedFilterMode(mode);
      },
      [entityController]
    );

    const handleShowAll = useCallback(() => {
      for (const stat of entityStats) {
        if (stat.mapId) {
          service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(stat.mapId, stat.entityDataIdKey, true);
        }
      }
      customPointTypes.forEach((typeConfig) => {
        void service.dataService.mapDataService.customPointDataService
          .updateItemVisibility(mapId, typeConfig.id, true)
          .catch(() => {});
      });
      ELECTRIC_POLE_DEVICE_KEYS.forEach((deviceKey) => {
        void service.dataService.mapDataService.electricPoleDataService
          .updateItemVisibility(mapId, deviceKey, true)
          .catch(() => {});
      });
    }, [entityStats, mapId]);

    const handleHideAll = useCallback(() => {
      for (const stat of entityStats) {
        if (stat.mapId) {
          service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(stat.mapId, stat.entityDataIdKey, false);
        }
      }
      customPointTypes.forEach((typeConfig) => {
        void service.dataService.mapDataService.customPointDataService
          .updateItemVisibility(mapId, typeConfig.id, false)
          .catch(() => {});
      });
      ELECTRIC_POLE_DEVICE_KEYS.forEach((deviceKey) => {
        void service.dataService.mapDataService.electricPoleDataService
          .updateItemVisibility(mapId, deviceKey, false)
          .catch(() => {});
      });
    }, [entityStats, mapId]);

    const CATEGORY_ORDER = [
      CustomPointKey, ElectricPoleKey, NoteKey,
      'disposable', 'trchest', 'rare_gather', 'common_gather', 'system', 'enemy', 'dnarrative', 'narrative',
    ];

    const groupedStats: { category: string; stats: FilterStat[] }[] = [];
    const groupedMap = new Map<string, FilterStat[]>();
    for (const stat of mergedStats) {
      const key = stat.category;
      const existing = groupedMap.get(key);
      if (existing) {
        existing.push(stat);
      } else {
        const arr = [stat];
        groupedMap.set(key, arr);
        groupedStats.push({ category: key, stats: arr });
      }
    }

    groupedStats.sort((a, b) => {
      const aIdx = CATEGORY_ORDER.indexOf(a.category);
      const bIdx = CATEGORY_ORDER.indexOf(b.category);
      return (aIdx === -1 ? CATEGORY_ORDER.length : aIdx) - (bIdx === -1 ? CATEGORY_ORDER.length : bIdx);
    });

    return (
      <TrueSheet
        ref={sheetRef}
        cornerRadius={16}
        grabber
      >
        <View className="px-5 pt-5 pb-10" style={{ height: SCREEN_HEIGHT * 0.85 }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text-primary">{t('sidebar:filter.title', { defaultValue: '标点筛选' })}</Text>
            <View className="flex-row gap-2">
              <Pressable className="rounded-lg bg-bg-tertiary px-3 py-1.5" onPress={handleShowAll}>
                <Text className="text-[13px] font-medium text-text-tertiary">{t('common:select_all', { defaultValue: '全选' })}</Text>
              </Pressable>
              <Pressable className="rounded-lg bg-bg-tertiary px-3 py-1.5" onPress={handleHideAll}>
                <Text className="text-[13px] font-medium text-text-tertiary">{t('sidebar:filter.reset', { defaultValue: '重置' })}</Text>
              </Pressable>
            </View>
          </View>

          <View className="mb-4 flex-row gap-2">
            {([
              [MarkedFeatureFilterMode.All, t('sidebar:filter.all', { defaultValue: '全部' })],
              [MarkedFeatureFilterMode.Unmarked, t('sidebar:filter.unmarked', { defaultValue: '未标记' })],
              [MarkedFeatureFilterMode.Marked, t('sidebar:filter.marked', { defaultValue: '已标记' })],
            ] as const).map(([mode, label]) => (
              <Pressable
                key={mode}
                className={cn('rounded-[20px] px-4 py-2', currentFilterMode === mode ? 'bg-primary' : 'bg-bg-tertiary')}
                onPress={() => handleFilterModeChange(mode as MarkedFeatureFilterMode)}
              >
                <Text className={cn('text-sm font-medium', currentFilterMode === mode ? 'text-white' : 'text-text-tertiary')}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-5"
            showsVerticalScrollIndicator={false}
          >
            {groupedStats.map(({ category, stats: categoryStats }) => (
              <View key={category} className="mb-4">
                <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-placeholder">{getCategoryName(category, t)}</Text>
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
            {groupedStats.length === 0 && (
              <Text className="mt-10 text-center text-[15px] text-text-disabled">{t('sidebar:filter.empty', { defaultValue: '当前地图无标点数据' })}</Text>
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
    <Pressable className="flex-row items-center justify-between border-b border-b-border-light px-1 py-2.5" onPress={onToggle}>
      <View className="flex-1 flex-row items-center gap-2">
        <View className={cn('h-2.5 w-2.5 rounded-full', stat.visible ? 'bg-dot-active' : 'bg-dot-inactive')} />
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} className="h-6 w-6 rounded" resizeMode="contain" />
        ) : (
          <View className="h-6 w-6 rounded bg-progress-bg" />
        )}
        <Text className={cn('flex-1 text-sm', stat.visible ? 'text-text-secondary' : 'text-text-disabled')} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View className="ml-2 flex-row items-center gap-2">
        <View className="h-1 w-10 overflow-hidden rounded-sm bg-progress-bg">
          <View className="h-full rounded-sm bg-progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
        </View>
        <Text className="min-w-[40px] text-right text-xs text-text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {markedCount}/{total}
        </Text>
      </View>
    </Pressable>
  );
});
