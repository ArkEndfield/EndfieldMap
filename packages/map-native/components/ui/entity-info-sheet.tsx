import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter';

interface EntityInfoSheetProps {
  instance: EntityDataInstance | null;
  onDismiss: () => void;
}

/**
 * 标点信息 BottomSheet
 * 显示选中标点的详细信息和标记/取消标记操作
 */
export const EntityInfoSheet = observer(function EntityInfoSheet({
  instance,
  onDismiss,
}: EntityInfoSheetProps) {
  const adapter = useAdapter();
  const sheetRef = useRef<TrueSheet>(null);

  useEffect(() => {
    if (instance) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [instance]);

  const handleToggleMark = useCallback(() => {
    if (!instance) return;
    adapter.entityController.setMarked(instance.mapId, instance.id, !instance.marked);
  }, [adapter, instance]);

  const handleDismiss = useCallback(() => {
    adapter.activeFeatureController.clearActiveFeature();
    onDismiss();
  }, [adapter, onDismiss]);

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
            <Text style={styles.title} numberOfLines={1}>
              {instance.name}
            </Text>
            <Text style={styles.subtitle}>
              ID: {instance.id} · {instance.entityDataIdKey}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <InfoRow label="分类" value={instance.category} />
            <InfoRow label="地图" value={instance.mapId} />
            <InfoRow
              label="坐标"
              value={`(${instance.position.x.toFixed(1)}, ${instance.position.z.toFixed(1)})`}
            />
            <InfoRow label="状态" value={instance.marked ? '已标记' : '未标记'} />
          </View>

          <Pressable
            style={[styles.markButton, instance.marked && styles.markButtonActive]}
            onPress={handleToggleMark}
          >
            <Text style={[styles.markButtonText, instance.marked && styles.markButtonTextActive]}>
              {instance.marked ? '取消标记' : '标记完成'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.empty} />
      )}
    </TrueSheet>
  );
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
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
  markButton: {
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
