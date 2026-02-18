import type { LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';

import type { I18nServiceConfig } from './i18n';
import { I18nService } from './i18n';

import { ServerService } from './server';

import type { DatabaseServiceConfig } from './db';
import { DatabaseService } from './db';

export interface MapServiceConfig<T, R> {
  databaseConfig: Omit<DatabaseServiceConfig<T, R>, 'isDev'>;
  consolaReporter?: LoggerReporter;
  isDev?: boolean;
  i18nConfig?: Omit<I18nServiceConfig, 'isDev'>;
  backendHost?: string;
}

export class MapService<T, R> {
  public i18nService: I18nService;
  public serverService: ServerService;
  public databaseService: DatabaseService<T, R>;

  constructor(config: MapServiceConfig<T, R>) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    this.i18nService = new I18nService({
      isDev: config.isDev,
      ...config.i18nConfig,
    });
    this.serverService = new ServerService({
      backendHost: config.backendHost || '',
      i18nService: this.i18nService,
    });

    this.databaseService = new DatabaseService({
      isDev: config.isDev,
      ...config.databaseConfig,
    });
  }

  public translate(...args: Parameters<typeof this.i18nService.translate>) {
    return this.i18nService.translate(...args);
  }

  public async init() {
    await this.databaseService.init();
  }
}
