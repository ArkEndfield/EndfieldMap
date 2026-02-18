import type { LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import { I18nService, I18nServiceConfig } from './i18n';
import { ServerService } from './server';

export interface MapServiceConfig {
  consolaReporter?: LoggerReporter;
  i18nConfig?: I18nServiceConfig;
  backendHost?: string;
}

export class MapService {
  public i18nService: I18nService;
  public serverService: ServerService;

  constructor(config: MapServiceConfig) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    this.i18nService = new I18nService(config.i18nConfig);
    this.serverService = new ServerService({
      backendHost: config.backendHost || '',
      i18nService: this.i18nService,
    });
  }

  public translate(...args: Parameters<typeof this.i18nService.translate>) {
    return this.i18nService.translate(...args);
  }
}
