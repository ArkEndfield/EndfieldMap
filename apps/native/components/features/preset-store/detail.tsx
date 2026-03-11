import type { PresetStoreDetailData, PresetType } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

interface PresetStoreDetailProps {
  id: number;
  onBack: () => void;
}

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export function PresetStoreDetail({ id, onBack }: PresetStoreDetailProps) {
  const { t } = useTranslation(['sidebar', 'common']);
  const [detail, setDetail] = useState<PresetStoreDetailData<PresetType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await service.presetService.getPresetDetail(id);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleImport = useCallback(async () => {
    if (!detail || importing) return;

    setImporting(true);
    const result = await catchErrorWithTip(async () => {
      const importData = await service.presetService.getPresetImportData(id);

      if (detail.preset_type === 'electric_pole') {
        await service.dataService.mapDataService.electricPoleDataService.importPreset(
          importData.name,
          importData.snapshot,
        );
      } else {
        await service.dataService.mapDataService.customPointDataService.importPreset(
          importData.name,
          importData.snapshot,
        );
      }

      return true;
    });

    setImporting(false);

    if (result) {
      alertApi.info(t('sidebar:preset_store.import_success', { defaultValue: '导入成功' }));
    }
  }, [detail, importing, id, t]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg-primary">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-3 text-sm text-text-muted">
            {t('common:loading', { defaultValue: '加载中...' })}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View className="flex-1 bg-bg-primary">
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-sm text-error">
            {error || t('common:load_error', { defaultValue: '加载失败' })}
          </Text>
          <Pressable className="rounded-lg bg-primary px-4 py-2" onPress={onBack}>
            <Text className="text-sm font-medium text-white">
              {t('common:back', { defaultValue: '返回' })}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const type = detail.preset_type;
  const subType = detail.sub_type;

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Body */}
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
        {/* Basic info */}
        <View className="gap-2">
          <Text className="text-lg font-bold text-text-primary">{detail.name}</Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="person" size={12} color="#999" />
              <Text className="text-xs text-text-muted">{detail.user_nickname}</Text>
            </View>
            <Text className="text-xs text-text-muted">{formatDate(detail.created_at)}</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="visibility" size={12} color="#999" />
              <Text className="text-xs text-text-muted">{formatCount(detail.view_count)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="file-download" size={12} color="#999" />
              <Text className="text-xs text-text-muted">{formatCount(detail.import_count)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="favorite" size={12} color="#ff4757" />
              <Text className="text-xs text-text-muted">{formatCount(detail.like_count)}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="gap-1">
          <Text className="text-sm font-semibold text-text-primary">
            {t('sidebar:preset_store.description', { defaultValue: '描述' })}
          </Text>
          <Text className="text-xs leading-5 text-text-tertiary">
            {detail.description || t('common:no_data', { defaultValue: '暂无数据' })}
          </Text>
        </View>

        {/* Type tags */}
        <View className="gap-1">
          <Text className="text-sm font-semibold text-text-primary">
            {t('sidebar:preset_store.type', { defaultValue: '类型' })}
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'rounded-md border px-2.5 py-1',
                type === 'electric_pole'
                  ? 'border-[#E8C832]/30 bg-[#E8C832]/10'
                  : 'border-primary/30 bg-primary/10',
              )}
            >
              <Text
                className={cn(
                  'text-xs',
                  type === 'electric_pole' ? 'text-[#E8C832]' : 'text-primary',
                )}
              >
                {type === 'electric_pole'
                  ? t('sidebar:preset_store.preset_type.electric_pole', { defaultValue: '电线杆' })
                  : t('sidebar:preset_store.preset_type.custom_point', {
                      defaultValue: '自定义标点',
                    })}
              </Text>
            </View>
            {subType ? (
              <View className="rounded-md border border-border-default bg-bg-tertiary px-2.5 py-1">
                <Text className="text-xs text-text-tertiary">
                  {subType === 'pole'
                    ? t('sidebar:preset_store.sub_type.pole', { defaultValue: '电线杆' })
                    : t('sidebar:preset_store.sub_type.zipline', { defaultValue: '滑索' })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Share code */}
        <View className="gap-1">
          <Text className="text-sm font-semibold text-text-primary">
            {t('sidebar:preset_store.share_code', { defaultValue: '分享码' })}
          </Text>
          <View className="rounded-md bg-bg-tertiary px-3 py-2">
            <Text className="font-mono text-xs text-text-secondary" selectable>
              {detail.share_code}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-border-light bg-bg-primary px-4 py-3">
        <Pressable
          className={cn(
            'flex-row items-center justify-center gap-2 rounded-xl py-3',
            importing ? 'bg-primary/60' : 'bg-primary',
          )}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <MaterialIcons name="file-download" size={18} color="#fff" />
          )}
          <Text className="text-[15px] font-semibold text-white">
            {t('sidebar:preset_store.import', { defaultValue: '导入' })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
