import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingSection } from '@/components/features/settings/shared';

export const AboutPage = () => {
  const { t } = useTranslation('settings');
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openLink = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      <View className="mb-6 items-center pt-4">
        <Text className="text-xl font-bold text-text-primary">Endfield Map</Text>
        <Text className="mt-1 text-sm text-text-muted">v{version}</Text>
      </View>

      <SettingSection title={t('about.community')}>
        <CommunityRow
          title={t('about.qq_group', { group_number: '1020923535' })}
          onPress={() => openLink('https://qm.qq.com/q/6NDYnkjXmU')}
        />
        <CommunityRow
          title={t('about.discord')}
          onPress={() => openLink('https://discord.gg/DDgx65vaMF')}
          last
        />
      </SettingSection>

      <View className="mt-2 px-2">
        <Trans
          t={t}
          i18nKey="about.statement"
          parent={({ children }: { children: React.ReactNode }) => (
            <Text className="text-xs leading-5 text-text-muted">{children}</Text>
          )}
          components={{
            license: (
              <Text
                className="text-xs text-primary"
                onPress={() =>
                  Linking.openURL('https://creativecommons.org/licenses/by-nc-sa/4.0/')
                }
              />
            ),
          }}
        />
      </View>

      <View style={{ height: insets.bottom + 16 }} />
    </ScrollView>
  );
};

function CommunityRow({
  title,
  onPress,
  last,
}: {
  title: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center justify-between px-4 py-3 ${!last ? 'border-b border-border' : ''}`}
      onPress={onPress}
    >
      <Text className="text-[15px] text-text-primary">{title}</Text>
      <Text className="text-xs text-text-muted">{'>'}</Text>
    </Pressable>
  );
}
