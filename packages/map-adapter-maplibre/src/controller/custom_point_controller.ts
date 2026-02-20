import type {
  CustomPointData,
  CustomPointDataInstance,
  CustomPointKey,
  CustomPointNodeData,
  CustomPointTypeId,
  ICustomPointController,
  MapCoordinate,
  MapData,
  MapDataManager,
} from '@endfieldmap/map-core';
import { CustomPointMapDataManager } from '@endfieldmap/map-core';
import { action, observable } from 'mobx';

export interface CustomPointControllerConfig {
  mapDataManager: MapDataManager;
}

/**
 * MapLibre 自定义标点控制器
 */
export class CustomPointController implements ICustomPointController {
  public readonly dataManager: CustomPointMapDataManager;
  private readonly mapDataManager: MapDataManager;

  @observable accessor dataVersion = 0;

  constructor(config: CustomPointControllerConfig) {
    this.mapDataManager = config.mapDataManager;
    this.dataManager = new CustomPointMapDataManager(config.mapDataManager);
  }

  @action
  private bumpVersion(): void {
    this.dataVersion++;
  }

  loadCustomPointData(data: CustomPointNodeData[]): void {
    const mapData: Record<MapData['id'], CustomPointData[]> = {};
    for (const node of data) {
      const mapId = node.mapId;
      if (!mapData[mapId]) {
        mapData[mapId] = [];
      }
      mapData[mapId].push({
        levelLogicId: node.levelLogicId,
        entityDataIdKey: node.entityDataIdKey as CustomPointTypeId,
        templateId: node.templateId as typeof CustomPointKey,
        entityType: node.entityType as '#CustomPoint',
        position: node.position,
        properties: node.properties,
      } satisfies CustomPointData);
    }
    this.dataManager.loadData(mapData);
    this.bumpVersion();
  }

  createCustomPointData(
    _mapId: MapData['id'],
    position: MapCoordinate,
    type: CustomPointTypeId
  ): CustomPointData {
    const pointPosition = { x: position[0], y: 0, z: position[1] };
    return {
      levelLogicId: Date.now(),
      entityDataIdKey: type,
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: pointPosition,
      properties: {},
    };
  }

  @action
  addCustomPointData(mapId: MapData['id'], data: CustomPointData): CustomPointDataInstance {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.add(data);
    this.bumpVersion();
    return instance;
  }

  @action
  deleteCustomPoint(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const result = manager.remove(id);
    if (result) this.bumpVersion();
    return result;
  }

  @action
  setCustomPointVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);
  }

  @action
  setTypeVisible(typeId: string, visible: boolean): void {
    this.dataManager.setTypeVisible(typeId, visible);
    this.bumpVersion();
  }

  getTypeVisible(typeId: string): boolean {
    return this.dataManager.getTypeVisible(typeId);
  }

  @action
  setMapTypeVisible(mapId: MapData['id'], typeId: string, visible: boolean): void {
    this.dataManager.setMapTypeVisible(mapId, typeId, visible);
    this.bumpVersion();
  }

  @action
  importVisibility(data: Array<{ mapId: MapData['id']; entityKey: string; visible: boolean }>): void {
    this.dataManager.importVisibilityData(data);
    this.bumpVersion();
  }
}
