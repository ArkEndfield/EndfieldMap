import type { MapData } from '@endfieldmap/map-core';

import { DataService } from '@/services/data';
import { BaseUserDataService } from '@/services/user/data/_base';

export type CustomPointVisibilityCallback = (mapId: MapData['id'], entityKey: string, visible: boolean) => void;

export class CustomPointVisibilityService extends BaseUserDataService {
  private get db() {
    return DataService.dbStorage.database.customPointVisibility;
  }

  public static createId(mapId: MapData['id'], entityKey: string) {
    return `${mapId}|${entityKey}`;
  }

  public getAllMapVisibilityData() {
    return this.db.find().exec();
  }

  public async setVisibilityData(mapId: MapData['id'], entityKey: string, visible: boolean) {
    const idString = CustomPointVisibilityService.createId(mapId, entityKey);
    const now = Date.now();
    const doc = await this.db.findOne({ selector: { id: idString } }).exec();
    if (doc) {
      return doc.update({ $set: { visible, updatedAt: now } });
    }
    return this.db.insert({ id: idString, mapId, entityKey, visible, createdAt: now, updatedAt: now });
  }

  /**
   * 添加数据变化订阅
   */
  public addSubscribe(callback: CustomPointVisibilityCallback) {
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
      for (const callback of this.callbacks as CustomPointVisibilityCallback[]) {
        try {
          switch (changeEvent.operation) {
            case 'INSERT':
            case 'UPDATE':
              callback(
                changeEvent.documentData.mapId,
                changeEvent.documentData.entityKey,
                changeEvent.documentData.visible
              );
              break;
            case 'DELETE':
              callback(changeEvent.documentData.mapId, changeEvent.documentData.entityKey, false);
              break;
          }
        } catch (e) {
          // 忽略回调错误
        }
      }
    });

    this.subscriptions.push(sub);
  }

  public clearAllData() {
    return this.db.find().remove();
  }
}
