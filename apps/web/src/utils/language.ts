import { service } from '@/services';

export const getLanguage = service.i18nService.getLanguage.bind(service.i18nService);
