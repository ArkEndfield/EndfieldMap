import type { DataInstance } from '@endfieldmap/map-core/types/event';
import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/context/adapter';
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
    adapter.moveToEntityInstance(instance, true, true, 800);
  }, [adapter, instance]);

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
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {iconUrl && (
                <Image source={{ uri: iconUrl }} style={styles.icon} resizeMode="contain" />
              )}
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.subtitle}>
                  {categoryName} · ID: {instance.id}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
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

          <View style={styles.actions}>
            <Pressable style={styles.navButton} onPress={handleNavigate}>
              <Text style={styles.navButtonText}>{t('popup:locate', { defaultValue: '定位' })}</Text>
            </Pressable>

            {isMarkable && (
              <Pressable
                style={[styles.markButton, instance.marked && styles.markButtonActive]}
                onPress={handleToggleMark}
              >
                <Text style={[styles.markButtonText, instance.marked && styles.markButtonTextActive]}>
                  {instance.marked ? t('common:operate.unmark', { defaultValue: '取消标记' }) : t('common:operate.mark', { defaultValue: '标记完成' })}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.empty} />
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
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  infoSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  markButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  markButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  markButtonTextActive: {
    color: '#666',
  },
  empty: {
    height: 1,
  },
});
