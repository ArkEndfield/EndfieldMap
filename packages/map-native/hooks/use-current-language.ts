import { service } from '@/services/map-service';

export const useCurrentLanguage = () => {
  return service.i18nService.currentLocale;
};
