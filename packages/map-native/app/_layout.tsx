import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AlertProvider } from '@/components/ui/alert';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { service } from '@/services/map-service';

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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <AlertProvider />
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
