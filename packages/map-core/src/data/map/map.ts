import { type ElectricPoleDeviceKey, getElectricPoleDeviceConfig } from '@endfieldmap/map-core/const';
import type { MapData, MapDataJson, Position } from '@endfieldmap/map-core/types';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export class MapDataManager {
  @observable accessor data: MapData[];
  @observable accessor version: MapDataJson['version'];
  @observable accessor currentMapId: MapData['id'];

  /**
   * 地图数据管理器
   * @param data 地图数据
   */
  constructor(data: MapDataJson) {
    if (!data.data || !data.version) {
      throw new Error('Invalid map data');
    }
    this.data = data.data;
    this.version = data.version;
    this.currentMapId = data.data[0].id;
  }

  /**
   * 获取地图数据
   * @param id 地图id
   * @returns 地图数据
   */
  public getMapData(id: MapData['id']) {
    return this.data.find((map) => map.id === id);
  }

  /**
   * 获取地图中心点
   * @param id 地图id
   * @returns 地图中心点
   */
  public getMapCenter(id: MapData['id']) {
    const mapData = this.getMapData(id);
    if (!mapData) {
      throw new Error('Invalid map id');
    }
    return this.xyz2crd(mapData.center, id);
  }

  /**
   * 当前地图的数据
   */
  @computed
  get currentMap() {
    return this.data.find((map) => map.id === this.currentMapId);
  }

  /**
   * 地图id列表
   */
  @computed
  get mapIds() {
    return this.data.map((map) => map.id);
  }

  /**
   * xyz 转 crd
   * @param pos xyz 坐标
   * @returns crd 坐标
   */
  public xyz2crd(pos: Position, mapId: MapData['id']): Coordinate {
    const mapData = this.getMapData(mapId);
    if (!mapData) {
      throw new Error('Invalid map id');
    }
    const scale = mapData.scale;
    const offset = mapData.offset;
    return [pos.x / scale + offset.x, pos.z / scale + offset.z];
  }

  /**
   * crd 转 xyz
   * @param pos crd 坐标
   * @returns xyz 坐标
   */
  public crd2xyz(coordinate: Coordinate, mapId: MapData['id']): Position {
    const mapData = this.getMapData(mapId);
    if (!mapData) {
      throw new Error('Invalid map id');
    }
    const scale = mapData.scale;
    const offset = mapData.offset;
    return { x: (coordinate[0] - offset.x) * scale, y: 0, z: (coordinate[1] - offset.z) * scale };
  }

  public getElectricPoleRangeRadius(mapId: MapData['id'], key: ElectricPoleDeviceKey) {
    const mapData = this.getMapData(mapId);
    if (!mapData) {
      throw new Error('Invalid map id');
    }
    const config = getElectricPoleDeviceConfig(key);
    const override = config.rangeRadiusByMapId?.[mapId];
    if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
      return override;
    }

    const baseRadius = mapData.electricZoneBaseSize;
    return (config.rangeMeters / 80) * baseRadius;
  }

  @action
  setCurrentMap(id: MapData['id']) {
    if (!this.data.find((map) => map.id === id)) {
      throw new Error('Invalid map id');
    }
    this.currentMapId = id;
  }
}
