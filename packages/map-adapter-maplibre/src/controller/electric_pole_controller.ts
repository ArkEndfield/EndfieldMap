import type {
  ElectricPoleData,
  ElectricPoleDataInstance,
  ElectricPoleDeviceKey,
  ElectricPoleIdKey,
  ElectricPoleKey,
  ElectricPoleNodeData,
  IElectricPoleController,
  MapCoordinate,
  MapData,
  MapDataManager,
} from '@endfieldmap/map-core';
import { ElectricPoleMapDataManager } from '@endfieldmap/map-core';
import { action, observable } from 'mobx';

export interface ElectricPoleControllerConfig {
  mapDataManager: MapDataManager;
}

/**
 * MapLibre 电线杆控制器
 * 管理电线杆数据，渲染由 React 组件观察 MobX 状态驱动
 */
export class ElectricPoleController implements IElectricPoleController {
  public readonly dataManager: ElectricPoleMapDataManager;
  private readonly mapDataManager: MapDataManager;

  @observable accessor dataVersion = 0;

  constructor(config: ElectricPoleControllerConfig) {
    this.mapDataManager = config.mapDataManager;
    this.dataManager = new ElectricPoleMapDataManager(config.mapDataManager);
  }

  @action
  private bumpVersion(): void {
    this.dataVersion++;
  }

  loadElectricPoleData(data: ElectricPoleNodeData[]): void {
    const mapData: Record<MapData['id'], ElectricPoleData[]> = {};
    for (const node of data) {
      const mapId = node.mapId;
      if (!mapData[mapId]) {
        mapData[mapId] = [];
      }
      mapData[mapId].push({
        levelLogicId: node.levelLogicId,
        entityDataIdKey: node.entityDataIdKey as typeof ElectricPoleIdKey,
        templateId: node.templateId as typeof ElectricPoleKey,
        entityType: node.entityType as '#ElectricPole',
        position: node.position,
        properties: node.properties,
      } satisfies ElectricPoleData);
    }
    this.dataManager.loadData(mapData);
    this.bumpVersion();
  }

  createElectricPoleData(
    _mapId: MapData['id'],
    position: MapCoordinate,
    deviceKey?: ElectricPoleDeviceKey
  ): ElectricPoleData {
    const polePosition = { x: position[0], y: 0, z: position[1] };
    return {
      levelLogicId: Date.now(),
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: polePosition,
      properties: { deviceKey },
    };
  }

  @action
  addElectricPoleData(mapId: MapData['id'], data: ElectricPoleData): ElectricPoleDataInstance {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.add(data);
    this.bumpVersion();
    return instance;
  }

  @action
  connectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void {
    const manager = this.dataManager.getMapManager(mapId);
    const fromInstance = manager.getById(fromId);
    const toInstance = manager.getById(toId);
    if (fromInstance && toInstance) {
      fromInstance.connectTo(toInstance);
      this.bumpVersion();
    }
  }

  @action
  disconnectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void {
    const manager = this.dataManager.getMapManager(mapId);
    const fromInstance = manager.getById(fromId);
    if (fromInstance) {
      fromInstance.disconnectOutgoingTo(toId);
      this.bumpVersion();
    }
  }

  @action
  deleteElectricPole(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const result = manager.remove(id);
    if (result) this.bumpVersion();
    return result;
  }

  @action
  setZoneVisible(visible: boolean): void {
    this.dataManager.setZoneVisible(visible);
  }

  @action
  setVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);
  }

  @action
  setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setDeviceVisible(deviceKey, visible);
    this.bumpVersion();
  }

  @action
  setMapDeviceVisible(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setMapDeviceVisible(mapId, deviceKey, visible);
    this.bumpVersion();
  }

  getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean {
    return this.dataManager.getDeviceVisible(deviceKey);
  }

  @action
  importVisibility(data: Array<{ mapId: MapData['id']; entityKey: string; visible: boolean }>): void {
    this.dataManager.importVisibilityData(data);
    this.bumpVersion();
  }
}
