import { EntityMarkService } from '@endfieldmap/map-service/service/user/data/marked/entity';
import { CustomPointPresetDataService } from '@endfieldmap/map-service/service/user/data/preset/custom_point';
import { ElectricPolePresetDataService } from '@endfieldmap/map-service/service/user/data/preset/electric_pole';
import { RouteUserDataService } from '@endfieldmap/map-service/service/user/data/route';
import { SyncService } from '@endfieldmap/map-service/service/user/data/sync';
import {
  EntityVisibilityService,
  ScopedEntityVisibilityService,
} from '@endfieldmap/map-service/service/user/data/visibility/entity';
import { logger } from '@endfieldmap/tools';

import { DatabaseService } from '../../db';
import { I18nService } from '../../i18n';
import { ServerService } from '../../server';

export interface UserDataServiceConfig<T, R> {
  serverService: ServerService;
  i18nService: I18nService;
  databaseService: DatabaseService<T, R>;
}

export class UserDataService<T, R> {
  public entityMarkService: EntityMarkService<T, R>;
  public entityVisibilityService: EntityVisibilityService<T, R>;
  public electricPoleVisibilityService: ScopedEntityVisibilityService<T, R>;
  public customPointVisibilityService: ScopedEntityVisibilityService<T, R>;
  public customPointPresetDataService: CustomPointPresetDataService<T, R>;
  public electricPolePresetDataService: ElectricPolePresetDataService<T, R>;
  public routeUserDataService: RouteUserDataService<T, R>;
  public syncService: SyncService<T, R>;

  constructor(config: UserDataServiceConfig<T, R>) {
    this.entityMarkService = new EntityMarkService({
      databaseService: config.databaseService,
    });
    this.entityVisibilityService = new EntityVisibilityService({
      databaseService: config.databaseService,
    });
    this.electricPoleVisibilityService = new ScopedEntityVisibilityService({
      databaseService: config.databaseService,
    }, 'electric_pole:');
    this.customPointVisibilityService = new ScopedEntityVisibilityService({
      databaseService: config.databaseService,
    }, 'custom_point:');
    this.customPointPresetDataService = new CustomPointPresetDataService({
      databaseService: config.databaseService,
    });
    this.electricPolePresetDataService = new ElectricPolePresetDataService({
      databaseService: config.databaseService,
    });
    this.routeUserDataService = new RouteUserDataService({
      databaseService: config.databaseService,
    });
    this.syncService = new SyncService({
      serverService: config.serverService,
      i18nService: config.i18nService,
      databaseService: config.databaseService,
    });
  }

  public async updateDB() {
    logger.info('[UserDataService] Updating all service database connections');
    await this.syncService.stopSync();
    this.entityMarkService.updateDB();
    this.entityVisibilityService.updateDB();
    this.customPointVisibilityService.updateDB();
    this.electricPoleVisibilityService.updateDB();
    this.customPointPresetDataService.updateDB();
    this.electricPolePresetDataService.updateDB();
    this.routeUserDataService.updateDB();
  }

  public async clearAllData() {
    await Promise.all([
      this.entityMarkService.clearAllData(),
      this.entityVisibilityService.clearAllData(),
      this.customPointVisibilityService.clearAllData(),
      this.electricPoleVisibilityService.clearAllData(),
      this.customPointPresetDataService.clearAllData(),
      this.electricPolePresetDataService.clearAllData(),
      this.routeUserDataService.clearAllData(),
    ]);
  }
}
