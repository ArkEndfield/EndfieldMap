import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import { logger } from '@endfieldmap/tools';
import type { Subscription } from 'rxjs';

type BaseCallback<T> = T extends (...args: infer P) => void ? (...args: P) => void : never;

export interface BaseUserDataServiceConfig<T, R> {
  databaseService: DatabaseService<T, R>;
}

/**
 * 用户数据服务基类
 */
export abstract class BaseUserDataService<TCallback, T, R> {
  protected subscriptions: Subscription[] = [];
  protected callbacks: Array<BaseCallback<TCallback>> = [];
  protected databaseService: DatabaseService<T, R>;

  constructor(config: BaseUserDataServiceConfig<T, R>) {
    this.databaseService = config.databaseService;
  }

  protected abstract registerDBSubscriptions(): void;

  protected clearSubscriptions(): void {
    for (const sub of this.subscriptions) {
      try {
        sub.unsubscribe();
      } catch (e) {
        logger.warn('[BaseUserDataService] Failed to unsubscribe', e);
      }
    }
    this.subscriptions = [];
  }

  protected executeCallbacks(...args: unknown[]): void {
    for (const callback of this.callbacks) {
      try {
        callback(...args);
      } catch (e) {
        logger.warn('[BaseUserDataService] Callback execution failed', e);
      }
    }
  }

  public updateDB(): void {
    logger.info(`[${this.constructor.name}] Updating database connection`);
    this.clearSubscriptions();
    this.registerDBSubscriptions();
    this.executeCallbacks();
  }

  protected get currentDatabase() {
    return this.databaseService.database;
  }
}
