import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/style';

const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'es-MX', label: 'Español (México)' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation(['header', 'settings']);
  const [current, setCurrent] = React.useState(i18n.language);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code).then(() => setCurrent(code));
  };

  return (
    <>
      <Stack.Screen options={{ title: t('header:settings.title') }} />
      <ScrollView className="flex-1 bg-bg-secondary" contentContainerClassName="px-4 pb-10 pt-4">
        <Text className="mb-3 text-base font-semibold text-text-primary">
          {t('settings:display.language.title')}
        </Text>

        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            className={cn(
              'mb-2 flex-row items-center justify-between rounded-xl px-4 py-3.5',
              lang.code === current ? 'bg-primary' : 'bg-bg-primary',
            )}
            onPress={() => handleChange(lang.code)}
          >
            <Text
              className={cn(
                'text-base',
                lang.code === current ? 'font-semibold text-white' : 'text-text-secondary',
              )}
            >
              {lang.label}
            </Text>
            <Text className="text-[13px] text-text-disabled">{lang.code}</Text>
          </Pressable>
        ))}

        <View className="mt-6 items-center">
          <Text className="text-xs text-text-disabled">Endfield Map v1.0.0</Text>
        </View>
      </ScrollView>
    </>
  );
}
