import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { PresetStoreDetail } from '@/components/features/preset-store/detail';

export default function PresetStoreDetailScreen() {
  const { t } = useTranslation(['sidebar']);
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const id = Number(params.id);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('sidebar:preset_store.title', { defaultValue: '预设商店' }),
        }}
      />
      <PresetStoreDetail id={id} onBack={handleBack} />
    </>
  );
}
