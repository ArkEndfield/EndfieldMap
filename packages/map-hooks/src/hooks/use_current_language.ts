import type { MapService } from '@endfieldmap/map-service';

export const useCurrentLanguage = <T, R>(service: MapService<T, R>) => {
  return service.i18nService.currentLocale;
};
