import { service } from '@/services';

export const useCurrentLanguage = () => {
  return service.i18nService.currentLocale;
};
