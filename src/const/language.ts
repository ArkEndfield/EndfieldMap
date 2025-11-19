import type { LanguageLocale } from '@/types/language';
import { Language } from '@endfieldmap/tools';

export const LanguageConfig: { code: Language; locale: LanguageLocale }[] = [
  { code: Language.ZH_CN, locale: 'cn' },
  { code: Language.ZH_TW, locale: 'tc' },
  { code: Language.EN_US, locale: 'en' },
  { code: Language.JA_JP, locale: 'jp' },
  { code: Language.KO_KR, locale: 'kr' },
];

export const LanguageMap = LanguageConfig.reduce(
  (acc, { code, locale }) => {
    acc[code] = locale;
    return acc;
  },
  {} as Record<Language, LanguageLocale>
);

export const LanguageMapReverse = LanguageConfig.reduce(
  (acc, { code, locale }) => {
    acc[locale] = code;
    return acc;
  },
  {} as Record<LanguageLocale, Language>
);
