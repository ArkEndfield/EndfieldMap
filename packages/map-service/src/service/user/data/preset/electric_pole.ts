import type { MapData } from '@endfieldmap/map-core';
import type { ElectricPolePreset } from '@endfieldmap/map-service/@types/electric_pole';
import type { DatabaseService, ElectricPoleNodeSchemaType } from '@endfieldmap/map-service/service/db/export';
import { BasePresetService, type NodeSelector } from '@endfieldmap/map-service/service/user/data/preset/_base';
import { logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

export interface ElectricPolePresetDataServiceConfig<T, R> {
  databaseService: DatabaseService<T, R>;
}

export class ElectricPolePresetDataService<T, R> extends BasePresetService<ElectricPolePreset, ElectricPoleNodeSchemaType> {
  private databaseService: DatabaseService<T, R>;

  constructor(config: ElectricPolePresetDataServiceConfig<T, R>) {
    super();
    this.databaseService = config.databaseService;
  }

  protected get presetDB() {
    return this.databaseService.database.electricPolePreset;
  }

  protected get nodesDB(): RxCollection<ElectricPoleNodeSchemaType> {
    return this.databaseService.database.electricPoleNode as RxCollection<ElectricPoleNodeSchemaType>;
  }

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

    if (currentConnections.includes(targetLevelLogicId)) {
      logger.warn(`Poles already connected: ${levelLogicId} -> ${targetLevelLogicId}`);
      return currentData as ElectricPoleNodeSchemaType;
    }

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

    const newConnections = currentConnections.filter((id) => id !== targetLevelLogicId);

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

  public async updateNodePosition(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    newPosition: { x: number; y: number; z: number }
  ): Promise<ElectricPoleNodeSchemaType | null> {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB
      .findOne({ selector: { id: nodeId } as NodeSelector<ElectricPoleNodeSchemaType> })
      .exec();
    if (!doc) {
      logger.warn(`Node not found for position update: ${nodeId}`);
      return null;
    }
    await doc.update({
      $set: {
        position: newPosition,
        updatedAt: Date.now(),
      } as Partial<ElectricPoleNodeSchemaType>,
    });
    return doc._data as ElectricPoleNodeSchemaType;
  }

  public clearAllData() {
    return this.presetDB.find().remove();
  }
}
