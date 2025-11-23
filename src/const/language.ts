import type { LanguageLocale } from '@eftypes/language';
import { Language } from '@endfieldmap/tools';

export const languageConfig: { code: Language; locale: LanguageLocale, displayName: string }[] = [
  { code: Language.ZH_CN, locale: 'cn', displayName: '简体中文' },
  { code: Language.ZH_TW, locale: 'tc', displayName: '繁体中文' },
  { code: Language.EN_US, locale: 'en', displayName: 'English' },
  { code: Language.JA_JP, locale: 'jp', displayName: '日本語' },
  { code: Language.KO_KR, locale: 'kr', displayName: '한국어' },
];

export const LanguageMap = languageConfig.reduce(
  (acc, { code, locale }) => {
    acc[code] = locale;
    return acc;
  },
  {} as Record<Language, LanguageLocale>
);

export const LanguageMapReverse = languageConfig.reduce(
  (acc, { code, locale }) => {
    acc[locale] = code;
    return acc;
  },
  {} as Record<LanguageLocale, Language>
);
