import { AdapterRegistry, type RegisterableAdapter } from '@endfieldmap/map-service/service/adapter_registry';
import { AssetService } from '@endfieldmap/map-service/service/asset';
import { DataService } from '@endfieldmap/map-service/service/data';
import type { DatabaseServiceConfig } from '@endfieldmap/map-service/service/db';
import { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { I18nServiceConfig } from '@endfieldmap/map-service/service/i18n';
import { I18nService } from '@endfieldmap/map-service/service/i18n';
import { LangHashService } from '@endfieldmap/map-service/service/lang_hash';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { ServerService } from '@endfieldmap/map-service/service/server';
import { UserService } from '@endfieldmap/map-service/service/user';
import type { LoggerReporter } from '@endfieldmap/tools';
import { JSONLoader,logger } from '@endfieldmap/tools';

export interface MapServiceConfig<T, R> {
  databaseConfig: Omit<DatabaseServiceConfig<T, R>, 'isDev'>;
  consolaReporter?: LoggerReporter;
  isDev?: boolean;
  i18nConfig: Omit<I18nServiceConfig, 'isDev'>;
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
  public userService: UserService<T, R>;
  public presetService: PresetService;
  public adapterRegistry: AdapterRegistry;

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
    this.presetService = new PresetService({
      serverService: this.serverService,
    });
    this.adapterRegistry = new AdapterRegistry();
    this.userService = new UserService({
      serverService: this.serverService,
      i18nService: this.i18nService,
      databaseService: this.databaseService,
    });
    this.dataService = new DataService({
      assetService: this.assetService,
      i18nService: this.i18nService,
      jsonLoader: this.jsonLoader,
      databaseService: this.databaseService,
      userService: this.userService,
      presetService: this.presetService,
      adapterRegistry: this.adapterRegistry,
    });
    this.langHashService = new LangHashService({
      jsonLoader: this.jsonLoader,
      assetService: this.assetService,
    });
  }

  public get translate() {
    return this.i18nService.translate;
  }

  public async init() {
    await Promise.all([this.databaseService.init(), this.dataService.init(), this.langHashService.init()]);
  }

  public async registerAdapter(adapter: RegisterableAdapter) {
    this.adapterRegistry.register(adapter);
    await this.dataService.mapDataService.init();
  }
}
