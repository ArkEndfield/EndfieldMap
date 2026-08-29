import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

interface EntityInfoSheetProps {
  instance: DataInstance | null;
  onDismiss: () => void;
}

function getEntityCategory(instance: DataInstance): string {
  if ('entityInfo' in instance && instance.entityInfo) {
    return instance.entityInfo.category;
  }
  return '';
}

function useEntityDisplayName(
  instance: DataInstance | null,
  t: (key: string, opts?: { defaultValue?: string; ns?: string }) => string
): { name: string; categoryName: string } {
  return useMemo(() => {
    if (!instance) return { name: '', categoryName: '' };
    const category = getEntityCategory(instance);

    const categoryName = t(`sidebar:filter.category.${category}`, { defaultValue: category });

    let name: string;
    if (category === ElectricPoleKey || category === CustomPointKey) {
      name = instance.name;
    } else {
      const entityInfo = 'entityInfo' in instance ? instance.entityInfo : undefined;
      const point = entityInfo?.entityInfo?.point;
      const hash = point ? service.langHashService.getHash(point) : null;
      name = hash ? t(`lang:${hash}`, { defaultValue: point || instance.name }) : instance.name;
    }

    return { name, categoryName };
  }, [instance, t]);
}

export const EntityInfoSheet = observer(function EntityInfoSheet({
  instance,
  onDismiss,
}: EntityInfoSheetProps) {
  const { t } = useTranslation(['sidebar', 'popup', 'common', 'lang']);
  const adapter = useAdapter();
  const sheetRef = useRef<TrueSheet>(null);

  const { name, categoryName } = useEntityDisplayName(instance, t);

  useEffect(() => {
    if (instance) {
      sheetRef.current?.present().catch(() => {});
    } else {
      sheetRef.current?.dismiss().catch(() => {});
    }
  }, [instance]);

  const iconUrl = useMemo(() => {
    if (!instance) return null;
    const info = 'entityInfo' in instance ? instance.entityInfo : undefined;
    if (!info) return null;
    return `${adapter.asset.entityImage}/${info.entityInfo.pic}.png`;
  }, [instance, adapter.asset.entityImage]);

  const handleToggleMark = useCallback(() => {
    if (!instance) return;
    const entityType = instance.entityType;
    if (entityType === '#ElectricPole' || entityType === '#CustomPoint') return;
    adapter.entityController.setMarked(instance.mapId, instance.id, !instance.marked);
  }, [adapter, instance]);

  const handleNavigate = useCallback(() => {
    if (!instance) return;
    void service.dataService.mapDataService.moveToEntityInstance(instance, true, true, 800);
  }, [instance]);

  const handleDismiss = useCallback(() => {
    adapter.activeFeatureController.clearActiveFeature();
    onDismiss();
  }, [adapter, onDismiss]);

  const isMarkable = instance
    ? 'markable' in instance ? (instance as { markable: boolean }).markable : true
    : false;

  return (
    <TrueSheet
      ref={sheetRef}
      cornerRadius={16}
      grabber
      onDidDismiss={handleDismiss}
    >
      {instance ? (
        <View className="p-5 pb-10">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              {iconUrl && (
                <Image source={{ uri: iconUrl }} className="h-11 w-11 rounded-[10px] bg-bg-tertiary" resizeMode="contain" />
              )}
              <View className="flex-1">
                <Text className="mb-1 text-xl font-bold text-text-primary" numberOfLines={2}>
                  {name}
                </Text>
                <Text className="text-[13px] text-text-muted">
                  {categoryName} · ID: {instance.id}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-5 rounded-xl bg-bg-secondary p-3">
            <InfoRow label={t('popup:category', { defaultValue: '分类' })} value={categoryName} />
            <InfoRow label={t('popup:map', { defaultValue: '地图' })} value={instance.mapId} />
            <InfoRow
              label={t('popup:coordinate', { defaultValue: '坐标' })}
              value={`(${instance.position.x.toFixed(1)}, ${instance.position.z.toFixed(1)})`}
            />
            {isMarkable && (
              <InfoRow
                label={t('popup:status', { defaultValue: '状态' })}
                value={instance.marked ? t('common:operate.marked', { defaultValue: '已标记' }) : t('sidebar:filter.unmarked', { defaultValue: '未标记' })}
                valueColor={instance.marked ? '#4CAF50' : '#FF9800'}
              />
            )}
          </View>

          <View className="flex-row gap-3">
            <Pressable className="flex-1 items-center rounded-xl bg-bg-tertiary py-3.5" onPress={handleNavigate}>
              <Text className="text-base font-semibold text-text-secondary">{t('popup:locate', { defaultValue: '定位' })}</Text>
            </Pressable>

            {isMarkable && (
              <Pressable
                className={cn('flex-2 items-center rounded-xl py-3.5', instance.marked ? 'bg-bg-tertiary' : 'bg-primary')}
                onPress={handleToggleMark}
              >
                <Text className={cn('text-base font-semibold', instance.marked ? 'text-text-tertiary' : 'text-white')}>
                  {instance.marked ? t('common:operate.unmark', { defaultValue: '取消标记' }) : t('common:operate.mark', { defaultValue: '标记完成' })}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View className="h-px" />
      )}
    </TrueSheet>
  );
});

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-sm text-text-tertiary">{label}</Text>
      <Text className="text-sm font-medium text-text-secondary" style={valueColor ? { color: valueColor } : undefined}>{value}</Text>
    </View>
  );
}
