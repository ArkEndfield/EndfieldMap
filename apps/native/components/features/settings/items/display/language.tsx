import type { Language } from '@endfieldmap/tools';
import { cn } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SettingSection } from '@/components/features/settings/shared';
import { useCurrentLanguage } from '@endfieldmap/map-hooks';
import { service } from '@/services/map-service';

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation('settings');
  const currentLocale = useCurrentLanguage(service);
  const languageList = service.i18nService.languageList;

  const changeLanguage = (locale: Language) => {
    i18n.changeLanguage(locale);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      <SettingSection title={t('display.language.title')}>
        {languageList.map((locale, idx) => (
          <Pressable
            key={locale.code}
            className={cn(
              'flex-row items-center justify-between px-4 py-3',
              idx < languageList.length - 1 && 'border-b border-border'
            )}
            onPress={() => changeLanguage(locale.code)}
          >
            <View className="flex-row items-center gap-2">
              <Text
                className={cn(
                  'text-[15px]',
                  locale.code === currentLocale ? 'font-semibold text-primary' : 'text-text-primary'
                )}
              >
                {locale.displayName}
              </Text>
              <View
                className={cn(
                  'rounded-full border px-1.5 py-0.5',
                  locale.code === currentLocale ? 'border-primary/40' : 'border-text-muted/30'
                )}
              >
                <Text className={cn('text-[10px]', locale.code === currentLocale ? 'text-primary' : 'text-text-muted')}>
                  {t(`display.language.language_list.${locale.code}`)}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-text-muted">{locale.code}</Text>
          </Pressable>
        ))}
      </SettingSection>
    </ScrollView>
  );
};
