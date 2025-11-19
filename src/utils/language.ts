import { LanguageMap, LanguageMapReverse } from '@/const/language';
import type { LanguageLocale } from '@/types/language';
import type { Language } from '@endfieldmap/tools';

export const getLanguageLocale = (language: Language) => {
  return LanguageMap[language];
};

export const getLanguage = (locale: LanguageLocale) => {
  return LanguageMapReverse[locale];
};
