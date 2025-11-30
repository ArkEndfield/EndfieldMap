import type { LanguageLocale } from '@eftypes/language';
import type { Language } from '@endfieldmap/tools';

import { LanguageMap, LanguageMapReverse } from '@/const/language';

export const getLanguageLocale = (language: Language) => {
  return LanguageMap[language];
};

export const getLanguage = (locale: LanguageLocale) => {
  return LanguageMapReverse[locale];
};
