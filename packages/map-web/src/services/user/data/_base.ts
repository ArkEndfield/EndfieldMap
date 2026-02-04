import { logger } from '@endfieldmap/tools';
import type { Subscription } from 'rxjs';

import { DataService } from '@/services/data';

type BaseCallback<T> = T extends (...args: infer P) => void ? (...args: P) => void : never;
/**
 * 用户数据服务基类
 * 提供数据库切换时的监听器管理功能
 */
export abstract class BaseUserDataService<T> {
  // 存储 RxDB 订阅，用于在数据库切换时取消订阅
  protected subscriptions: Subscription[] = [];

  // 存储外部注册的回调函数
  protected callbacks: Array<BaseCallback<T>> = [];

  /**
   * 子类需要实现的方法：注册数据库监听
   * 在数据库切换时会重新调用
   */
  protected abstract registerDBSubscriptions(): void;

  /**
   * 清除所有数据库订阅
   */
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

  /**
   * 执行所有已注册的回调
   * 用于在数据库切换后通知外部
   */
  protected executeCallbacks(...args: unknown[]): void {
    for (const callback of this.callbacks) {
      try {
        callback(...args);
      } catch (e) {
        logger.warn('[BaseUserDataService] Callback execution failed', e);
      }
    }
  }

  /**
   * 更新数据库连接
   * 在用户登录/登出时调用，重新注册监听器
   */
  public updateDB(): void {
    logger.info(`[${this.constructor.name}] Updating database connection`);

    // 清除旧的订阅
    this.clearSubscriptions();

    // 重新注册订阅
    this.registerDBSubscriptions();

    // 执行回调通知外部数据库已更新
    this.executeCallbacks();
  }

  /**
   * 获取当前数据库
   * 子类可以重写此方法以获取特定的数据库引用
   */
  protected get currentDatabase() {
    return DataService.dbStorage.database;
  }
}
