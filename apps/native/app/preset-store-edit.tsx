import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

export default function PresetStoreEditScreen() {
  const { t } = useTranslation(['sidebar', 'common']);
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    description: string;
    is_public: string;
  }>();
  const router = useRouter();

  const presetId = Number(params.id);
  const [name, setName] = useState(params.name ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [isPublic, setIsPublic] = useState(params.is_public !== 'false');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      alertApi.info(
        t('sidebar:preset_store.edit_form.name_required', { defaultValue: '名称不能为空' }),
      );
      return;
    }

    setSubmitting(true);
    const result = await catchErrorWithTip(async () => {
      await service.presetService.updateSharePreset(presetId, {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
      });
    });
    setSubmitting(false);

    if (result !== false) {
      alertApi.info(
        t('sidebar:preset_store.edit_success', { defaultValue: '编辑成功' }),
      );
      router.back();
    }
  }, [presetId, name, description, isPublic, router, t]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('sidebar:preset_store.edit', { defaultValue: '编辑预设' }),
        }}
      />
      <View className="flex-1 bg-bg-secondary">
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
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
              placeholder={t('sidebar:preset_store.edit_form.description', {
                defaultValue: '描述',
              })}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Is public */}
          <View className="flex-row items-center justify-between rounded-lg bg-bg-primary px-4 py-3">
            <Text className="text-base text-text-primary">
              {t('sidebar:preset_store.edit_form.is_public', { defaultValue: '公开' })}
            </Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>
        </ScrollView>

        {/* Submit button */}
        <View className="border-t border-border-light bg-bg-primary px-4 py-3">
          <Pressable
            className={submitting ? 'items-center rounded-xl bg-primary/60 py-3' : 'items-center rounded-xl bg-primary py-3'}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : (
              <Text className="text-[15px] font-semibold text-white">
                {t('common:confirm', { defaultValue: '确认' })}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}
