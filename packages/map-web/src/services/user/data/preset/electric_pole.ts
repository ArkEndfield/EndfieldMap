import type { MapData } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

import type { ElectricPolePreset } from '@/@types/electric_pole';
import { DataService } from '@/services/data';
import type { ElectricPoleNodeSchemaType } from '@/services/data/db/schema/user_data/electric_pole';
import type { NodeSelector } from '@/services/user/data/preset/_base';
import { BasePresetService } from '@/services/user/data/preset/_base';

export class ElectricPolePresetDataService extends BasePresetService<ElectricPolePreset, ElectricPoleNodeSchemaType> {
  protected get presetDB() {
    return DataService.dbStorage.database.electricPolePreset;
  }

  protected get nodesDB(): RxCollection<ElectricPoleNodeSchemaType> {
    return DataService.dbStorage.database.electricPoleNode as RxCollection<ElectricPoleNodeSchemaType>;
  }

  /**
   * 连接两个电线杆
   * @param mapId 地图 ID
   * @param presetId 预设 ID
   * @param levelLogicId 源电线杆的 levelLogicId
   * @param targetLevelLogicId 目标电线杆的 levelLogicId
   */
  public async connectPoles(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    targetLevelLogicId: number
  ): Promise<ElectricPoleNodeSchemaType | null> {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB
      .findOne({ selector: { id: nodeId } as NodeSelector<ElectricPoleNodeSchemaType> })
      .exec();
    if (!doc) {
      logger.warn(`Node not found for connection: ${nodeId}`);
      return null;
    }

    const currentData = doc._data;
    const currentConnections = (currentData.properties?.connections as number[]) ?? [];

    // 检查是否已连接
    if (currentConnections.includes(targetLevelLogicId)) {
      logger.warn(`Poles already connected: ${levelLogicId} -> ${targetLevelLogicId}`);
      return currentData as ElectricPoleNodeSchemaType;
    }

    // 添加新连接
    const newConnections = [...currentConnections, targetLevelLogicId];

    await doc.update({
      $set: {
        properties: {
          ...currentData.properties,
          connections: newConnections,
        },
      } as Partial<ElectricPoleNodeSchemaType>,
    });

    return doc._data as ElectricPoleNodeSchemaType;
  }

  /**
   * 删除电线杆之间的连线
   * @param mapId 地图 ID
   * @param presetId 预设 ID
   * @param levelLogicId 源电线杆的 levelLogicId
   * @param targetLevelLogicId 目标电线杆的 levelLogicId
   */
  public async disconnectPoles(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    targetLevelLogicId: number
  ): Promise<ElectricPoleNodeSchemaType | null> {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB
      .findOne({ selector: { id: nodeId } as NodeSelector<ElectricPoleNodeSchemaType> })
      .exec();
    if (!doc) {
      logger.warn(`Node not found for disconnection: ${nodeId}`);
      return null;
    }

    const currentData = doc._data;
    const currentConnections = (currentData.properties?.connections as number[]) ?? [];

    // 过滤掉目标连接
    const newConnections = currentConnections.filter((id) => id !== targetLevelLogicId);

    // 如果没有变化，直接返回
    if (newConnections.length === currentConnections.length) {
      logger.warn(`Connection not found: ${levelLogicId} -> ${targetLevelLogicId}`);
      return currentData as ElectricPoleNodeSchemaType;
    }

    await doc.update({
      $set: {
        properties: {
          ...currentData.properties,
          connections: newConnections,
        },
      } as Partial<ElectricPoleNodeSchemaType>,
    });

    return doc._data as ElectricPoleNodeSchemaType;
  }

  public clearAllData() {
    return this.presetDB.find().remove();
  }
}
