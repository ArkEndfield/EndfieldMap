import { AdapterRegistry, type RegisterableAdapter } from '@endfieldmap/map-service/service/adapter_registry';
import { AiService } from '@endfieldmap/map-service/service/ai';
import { AssetService } from '@endfieldmap/map-service/service/asset';
import { DataService } from '@endfieldmap/map-service/service/data';
import type { DatabaseServiceConfig } from '@endfieldmap/map-service/service/db';
import { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { I18nServiceConfig } from '@endfieldmap/map-service/service/i18n';
import { I18nService } from '@endfieldmap/map-service/service/i18n';
import { LangHashService } from '@endfieldmap/map-service/service/lang_hash';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { ServerService } from '@endfieldmap/map-service/service/server';
import { SklandPositionService } from '@endfieldmap/map-service/service/skland_position';
import { SklandRouteService } from '@endfieldmap/map-service/service/skland_route';
import { SklandSyncService } from '@endfieldmap/map-service/service/skland_sync';
import { UserService } from '@endfieldmap/map-service/service/user';
import type { LoggerReporter } from '@endfieldmap/tools';
import { JSONLoader, logger } from '@endfieldmap/tools';

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
  public sklandSyncService: SklandSyncService<T, R>;
  public sklandPositionService: SklandPositionService;
  public sklandRouteService: SklandRouteService;
  public adapterRegistry: AdapterRegistry;
  public aiService: AiService<T, R>;

  constructor(config: MapServiceConfig<T, R>) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    this.assetService = new AssetService(config.assetsHost || '');
    this.i18nService = new I18nService({
      isDev: config.isDev,
      ...config.i18nConfig,
      // lang 命名空间体量巨大（按 MD5 哈希存的实体名/描述），不再打包，
      // 运行时按 locale 从 CDN 外部加载；其余命名空间沿用 app 传入的 loader。
      resourceLoader: (language, namespace) => {
        if (namespace === 'lang') {
          return this.jsonLoader.loadJSON<Record<string, unknown>>(
            `${this.assetService.url.langI18n}/${language}/lang.json`
          );
        }
        return config.i18nConfig.resourceLoader(language, namespace);
      },
    });
    this.serverService = new ServerService({
      backendHost: config.backendHost || '',
      i18nService: this.i18nService,
    });
    this.databaseService = new DatabaseService({
      isDev: config.isDev,
      ...config.databaseConfig,
    });
    this.presetService = new PresetService({
      serverService: this.serverService,
    });
    this.adapterRegistry = new AdapterRegistry();
    this.sklandPositionService = new SklandPositionService({
      serverService: this.serverService,
    });
    this.sklandRouteService = new SklandRouteService({
      serverService: this.serverService,
    });
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
      serverService: this.serverService,
      sklandRouteService: this.sklandRouteService,
    });
    this.langHashService = new LangHashService({
      jsonLoader: this.jsonLoader,
      assetService: this.assetService,
    });
    this.aiService = new AiService({
      adapterRegistry: this.adapterRegistry,
      mapDataService: this.dataService.mapDataService,
      i18nService: this.i18nService,
      langHashService: this.langHashService,
    });
    this.sklandSyncService = new SklandSyncService({
      serverService: this.serverService,
      mapDataService: this.dataService.mapDataService,
      adapterRegistry: this.adapterRegistry,
    });
  }

  public get translate() {
    return this.i18nService.translate;
  }

  public async init() {
    await this.databaseService.init();
    await this.userService.updateUidList(false).catch((error: unknown) => {
      logger.warn('[MapService] Could not initialize cloud sync; using local data', error);
    });
    await Promise.all([this.dataService.init(), this.langHashService.init()]);
  }

  public async registerAdapter(adapter: RegisterableAdapter) {
    this.adapterRegistry.register(adapter);
    await this.dataService.mapDataService.init();
  }
}
