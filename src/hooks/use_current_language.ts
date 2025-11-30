import { useTranslation } from 'react-i18next';

import { getLanguage } from '@/utils/language';

export const useCurrentLanguage = () => {
  const { i18n } = useTranslation();
  const currentLocale = getLanguage(i18n.languages);
  return currentLocale;
};
