import { Language } from '@endfieldmap/tools';

import { languageConfig } from '@/const/language';

export const getLanguage = (locale: readonly string[]): Language => {
  return (locale.find((locale) => languageConfig.some((item) => item.code === locale)) || Language.ZH_CN) as Language;
};
