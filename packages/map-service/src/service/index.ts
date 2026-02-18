import type { LoggerReporter } from '@endfieldmap/tools';
import { logger, JSONLoader } from '@endfieldmap/tools';

import type { I18nServiceConfig } from './i18n';
import { I18nService } from './i18n';

import { ServerService } from './server';

import type { DatabaseServiceConfig } from './db';
import { DatabaseService } from './db';

import { DeltaRobotService } from './game/delta_robot';

import { AssetService } from './asset';

export interface MapServiceConfig<T, R> {
  databaseConfig: Omit<DatabaseServiceConfig<T, R>, 'isDev'>;
  consolaReporter?: LoggerReporter;
  isDev?: boolean;
  i18nConfig?: Omit<I18nServiceConfig, 'isDev'>;
  backendHost?: string;
  assetsHost?: string;
}

export class MapService<T, R> {
  public i18nService: I18nService;
  public serverService: ServerService;
  public databaseService: DatabaseService<T, R>;
  public assetService: AssetService;
  public deltaRobotService: DeltaRobotService<T, R>;
  public jsonLoader = new JSONLoader();

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
    this.assetService = new AssetService(config.assetsHost || '');
    this.databaseService = new DatabaseService({
      isDev: config.isDev,
      ...config.databaseConfig,
    });
    this.deltaRobotService = new DeltaRobotService({
      assetService: this.assetService,
      jsonLoader: this.jsonLoader,
      databaseService: this.databaseService,
    });
  }

  public translate(...args: Parameters<typeof this.i18nService.translate>) {
    return this.i18nService.translate(...args);
  }

  public async init() {
    await this.databaseService.init();
  }
}
