import type { EntityData, MapData } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

import { DataService } from '@/services/data';
import { BaseUserDataService } from '@/services/user/data/_base';

export type EntityMarkCallback = (mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) => void;

export class EntityMarkService extends BaseUserDataService<EntityMarkCallback> {
  private get db() {
    return DataService.dbStorage.database.entityMark;
  }

  public static createId(mapId: MapData['id'], id: EntityData['levelLogicId']) {
    return `${mapId}|${id}`;
  }

  public getAllMapMarkData() {
    return this.db.find().exec();
  }

  public async setMarkData(mapId: MapData['id'], entityId: EntityData['levelLogicId'], marked: boolean) {
    const idString = EntityMarkService.createId(mapId, entityId);
    const now = Date.now();
    const doc = await this.db.findOne({ selector: { id: idString } }).exec();
    if (doc) {
      return doc.update({ $set: { marked, updatedAt: now } });
    }
    return this.db.insert({ id: idString, mapId, entityId, marked, createdAt: now, updatedAt: now });
  }

  /**
   * 添加数据变化订阅
   */
  public addSubscribe(callback: EntityMarkCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  /**
   * 注册数据库订阅
   */
  protected registerDBSubscriptions(): void {
    // 清除旧的订阅
    this.clearSubscriptions();

    const sub = this.db.$.subscribe((changeEvent) => {
      for (const callback of this.callbacks as EntityMarkCallback[]) {
        try {
          switch (changeEvent.operation) {
            case 'INSERT':
            case 'UPDATE':
              callback(
                changeEvent.documentData.mapId,
                changeEvent.documentData.entityId,
                changeEvent.documentData.marked
              );
              break;
            case 'DELETE':
              callback(changeEvent.documentData.mapId, changeEvent.documentData.entityId, false);
              break;
          }
        } catch (e) {
          // 忽略回调错误
          logger.error('[EntityMarkService] Callback error', e);
        }
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * @deprecated 使用 addSubscribe 代替
   */
  public addScribe(callback: EntityMarkCallback) {
    this.addSubscribe(callback);
  }

  public clearAllData() {
    return this.db.find().remove();
  }
}
