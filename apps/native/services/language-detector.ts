import { getLocales } from 'expo-localization';
import type { LanguageDetectorModule } from 'i18next';

const SUPPORTED_LANGUAGES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'ru-RU', 'es-MX'];

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
