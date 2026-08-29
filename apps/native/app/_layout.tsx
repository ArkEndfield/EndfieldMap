import '../global.css';
import 'react-native-reanimated';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertProvider } from '@/components/ui/alert';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { service } from '@/services/map-service';

const IS_IOS_26 = Platform.OS === 'ios' && Number(Platform.Version) >= 26;

const cardScreenOptions = {
  presentation: 'card' as const,
  ...(IS_IOS_26 && {
    headerTransparent: true,
    headerBlurEffect: 'systemChromeMaterial' as const,
  }),
};

// eslint-disable-next-line react-refresh/only-export-components -- expo-router 布局协议要求的具名导出。
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const i18n = service.i18nService.i18n;

  return (
    <GestureHandlerRootView className="flex-1">
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={IS_IOS_26 ? { headerTransparent: true } : undefined}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={cardScreenOptions} />
            <Stack.Screen name="preset-store-detail" options={cardScreenOptions} />
            <Stack.Screen name="preset-store-edit" options={cardScreenOptions} />
            <Stack.Screen name="preset-share" options={cardScreenOptions} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <AlertProvider />
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
