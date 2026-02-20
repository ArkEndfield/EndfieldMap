import { getLocales } from 'expo-localization';
import type { LanguageDetectorModule } from 'i18next';

const SUPPORTED_LANGUAGES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'ru-RU', 'es-MX'];

/**
 * i18next language detector for React Native.
 * Reads the device locale via expo-localization and maps it to a supported language tag.
 */
export const NativeLanguageDetector: LanguageDetectorModule = {
  type: 'languageDetector',

  detect(): string {
    const locales = getLocales();
    for (const locale of locales) {
      const tag = locale.languageTag;
      if (SUPPORTED_LANGUAGES.includes(tag)) return tag;

      const lang = tag.split('-')[0];
      const match = SUPPORTED_LANGUAGES.find((s) => s.startsWith(lang + '-'));
      if (match) return match;
    }
    return 'zh-CN';
  },

  init() {},
  cacheUserLanguage() {},
};
