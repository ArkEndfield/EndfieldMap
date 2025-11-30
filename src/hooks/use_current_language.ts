import { useTranslation } from 'react-i18next';

import type { LanguageLocale } from '@/@types/language';
import { languageConfig } from '@/const/language';

export const useCurrentLanguage = () => {
  const { i18n } = useTranslation();
  const currentLocales = i18n.languages as LanguageLocale[];
  const currentLocale = currentLocales.find((locale) => languageConfig.some((item) => item.locale === locale)) || 'cn';
  return currentLocale;
};
