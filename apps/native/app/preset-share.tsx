import type { ElectricPoleType } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

const ELECTRIC_POLE_TYPE_OPTIONS: { key: ElectricPoleType; labelKey: string }[] = [
  { key: 'pole', labelKey: 'sidebar:preset_store.sub_type.pole' },
  { key: 'zipline', labelKey: 'sidebar:preset_store.sub_type.zipline' },
];

export default function PresetShareScreen() {
  const { t } = useTranslation(['sidebar', 'common']);
  const params = useLocalSearchParams<{
    presetId: string;
    presetType: 'electric_pole' | 'custom_point';
    defaultName: string;
  }>();
  const router = useRouter();

  const isElectricPole = params.presetType === 'electric_pole';

  const [name, setName] = useState(params.defaultName ?? '');
  const [description, setDescription] = useState('');
  const [poleType, setPoleType] = useState<ElectricPoleType>('pole');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      alertApi.info(
        t('sidebar:preset_store.edit_form.name_required', { defaultValue: '名称不能为空' }),
      );
      return;
    }

    setSubmitting(true);

    const dataService = isElectricPole
      ? service.dataService.mapDataService.electricPoleDataService
      : service.dataService.mapDataService.customPointDataService;

    if (!dataService.canShare) {
      setSubmitting(false);
      return;
    }

    const result = await catchErrorWithTip(async () => {
      if (isElectricPole) {
        await service.dataService.mapDataService.electricPoleDataService.sharePreset(
          params.presetId,
          name.trim(),
          description.trim(),
          poleType,
        );
      } else {
        await service.dataService.mapDataService.customPointDataService.sharePreset(
          params.presetId,
          name.trim(),
          description.trim(),
        );
      }
    });

    setSubmitting(false);

    if (result !== false) {
      alertApi.info(t('sidebar:preset_store.share_success', { defaultValue: '分享成功' }));
      router.back();
    }
  }, [params.presetId, name, description, poleType, isElectricPole, router, t]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('sidebar:preset_store.share', { defaultValue: '分享预设' }),
        }}
      />
      <View className="flex-1 bg-bg-secondary">
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
          {/* Type selector (electric pole only) */}
          {isElectricPole && (
            <View>
              <Text className="mb-1.5 text-sm font-medium text-text-secondary">
                {t('sidebar:preset_store.type', { defaultValue: '类型' })}
              </Text>
              <View className="flex-row overflow-hidden rounded-lg border border-border-default">
                {ELECTRIC_POLE_TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    className={cn(
                      'flex-1 items-center py-2.5',
                      poleType === opt.key ? 'bg-primary' : 'bg-bg-primary',
                    )}
                    onPress={() => setPoleType(opt.key)}
                  >
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        poleType === opt.key ? 'text-white' : 'text-text-secondary',
                      )}
                    >
                      {t(opt.labelKey, {
                        defaultValue: opt.key === 'pole' ? '电线杆' : '滑索',
                      })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Name */}
          <View>
            <Text className="mb-1.5 text-sm font-medium text-text-secondary">
              {t('sidebar:preset_store.edit_form.name', { defaultValue: '名称' })}
            </Text>
            <TextInput
              className="rounded-lg border border-border-default bg-bg-primary px-4 py-3 text-base text-text-primary"
              value={name}
              onChangeText={setName}
              placeholder={t('sidebar:preset_store.edit_form.name', { defaultValue: '名称' })}
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="mb-1.5 text-sm font-medium text-text-secondary">
              {t('sidebar:preset_store.edit_form.description', { defaultValue: '描述' })}
            </Text>
            <TextInput
              className="rounded-lg border border-border-default bg-bg-primary px-4 py-3 text-base text-text-primary"
              value={description}
              onChangeText={setDescription}
              placeholder={t('sidebar:preset_store.edit_form.description', { defaultValue: '描述' })}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>
        </ScrollView>

        {/* Submit button */}
        <View className="border-t border-border-light bg-bg-primary px-4 py-3">
          <Pressable
            className={cn(
              'flex-row items-center justify-center gap-2 rounded-xl py-3',
              submitting ? 'bg-primary/60' : 'bg-primary',
            )}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : null}
            <Text className="text-[15px] font-semibold text-white">
              {t('common:confirm', { defaultValue: '确认分享' })}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
