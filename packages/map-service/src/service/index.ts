import type { LoggerReporter } from '@endfieldmap/tools';
import { logger, JSONLoader } from '@endfieldmap/tools';

import type { I18nServiceConfig } from '@endfieldmap/map-service/service/i18n';
import { I18nService } from '@endfieldmap/map-service/service/i18n';

import { ServerService } from '@endfieldmap/map-service/service/server';

import type { DatabaseServiceConfig } from '@endfieldmap/map-service/service/db';
import { DatabaseService } from '@endfieldmap/map-service/service/db';

import { AssetService } from '@endfieldmap/map-service/service/asset';

import { DataService } from '@endfieldmap/map-service/service/data';

import { LangHashService } from '@endfieldmap/map-service/service/lang_hash';

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
  public langHashService: LangHashService;
  public jsonLoader = new JSONLoader();

  public dataService: DataService<T, R>;

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
    this.dataService = new DataService({
      assetService: this.assetService,
      jsonLoader: this.jsonLoader,
      databaseService: this.databaseService,
    });
    this.langHashService = new LangHashService({
      jsonLoader: this.jsonLoader,
      assetService: this.assetService,
    });
  }

  public translate(...args: Parameters<typeof this.i18nService.translate>) {
    return this.i18nService.translate(...args);
  }

  public async init() {
    await Promise.all([this.databaseService.init(), this.dataService.init(), this.langHashService.init()]);
  }
}
