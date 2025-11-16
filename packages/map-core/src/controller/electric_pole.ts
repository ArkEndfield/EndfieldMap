import { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';
import { ElectricPoleZoneLayer, DEFAULT_ELECTRIC_ZONE_RADIUS } from '@endfieldmap/map-core/render/layers/electric_pole_zone';
import type { ElectricPoleData, ElectricPoleDataList } from '@endfieldmap/map-core/types';
import { ElectricPoleIdKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { MultiLayerContainer } from '@endfieldmap/map-core/render/layers/multi_layer_container';
import { computed } from 'mobx';
import { Coordinate } from 'ol/coordinate';
import { crd2xyz, logger } from '@endfieldmap/tools';

export interface ElectricPoleControllerConfig {
  imagePath: string;
}

export class ElectricPoleController {
  public entityLayer: Map<MapIndex, ElectricPoleEntityLayer>;
  public connectionLayer: Map<MapIndex, ElectricPoleConnectionLayer>;
  public zoneLayer: Map<MapIndex, ElectricPoleZoneLayer>;
  public imagePath: string;
  public layerContainer: MultiLayerContainer | null = null;
  private currentMapIndex?: MapIndex;

  constructor(config: ElectricPoleControllerConfig) {
    this.imagePath = config.imagePath;
    this.entityLayer = new Map();
    this.connectionLayer = new Map();
    this.zoneLayer = new Map();
  }

  /**
   * 初始化地图电线杆图层
   * @param mapIndex 地图索引
   * @param data 电线杆数据列表
   */
  public initMapElectricPoleLayers(mapIndex: MapIndex, data: ElectricPoleDataList) {
    if (this.currentMapIndex === mapIndex) return;
    this.currentMapIndex = mapIndex;

    const entityLayer = new ElectricPoleEntityLayer({
      data: data,
      mapIndex: mapIndex,
      icon: {
        url: `${this.imagePath}/electric_pole.png`,
        size: 52,
      },
    });
    const connectionLayer = new ElectricPoleConnectionLayer({
      mapIndex: mapIndex,
    });
    const zoneLayer = new ElectricPoleZoneLayer({
      data: data,
      mapIndex: mapIndex,
      radius: DEFAULT_ELECTRIC_ZONE_RADIUS,
    });

    entityLayer.entity.features.forEach((feature) => {
      connectionLayer.addFeature(feature.connectionFeature);
      zoneLayer.addZone(feature.data);
    });

    this.entityLayer.set(mapIndex, entityLayer);
    this.connectionLayer.set(mapIndex, connectionLayer);
    this.zoneLayer.set(mapIndex, zoneLayer);
    this.layerContainer = new MultiLayerContainer([zoneLayer.layer, connectionLayer.layer, entityLayer.layer]);
  }

  /**
   * 切换地图图层
   * @param mapIndex 地图索引
   * @param data 电线杆数据列表
   */
  public switchMapElectricPoleLayers(mapIndex: MapIndex) {
    if (this.currentMapIndex === mapIndex) return;
    // 如果 entity / connection / zone 图层不存在，直接创建
    if (!this.entityLayer.has(mapIndex) || !this.connectionLayer.has(mapIndex) || !this.zoneLayer.has(mapIndex)) {
      this.initMapElectricPoleLayers(mapIndex, []);
    }
    this.currentMapIndex = mapIndex;
  }

  /**
   * 添加电线杆实体
   * @param mapIndex 地图索引
   * @param data 电线杆数据
   * @returns 电线杆实体
   */
  public addElectricPoleEntity(mapIndex: MapIndex, data: ElectricPoleData) {
    const entityLayer = this.entityLayer.get(mapIndex);
    const connectionLayer = this.connectionLayer.get(mapIndex);
    const zoneLayer = this.zoneLayer.get(mapIndex);
    if (!entityLayer || !connectionLayer || !zoneLayer) return;
    const feature = entityLayer.entity.addElectricPoleEntity(data);
    connectionLayer.addFeature(feature.connectionFeature);
    zoneLayer.addZone(feature.data);
    return feature;
  }

  /**
   * 获取当前地图的电线杆数据
   * @returns 电线杆数据列表
   */
  @computed
  public get currentData() {
    return this.currentMapIndex ? this.entityLayer.get(this.currentMapIndex)?.entity?.data ?? [] : [];
  }

  /**
   * 获取当前地图的所有电线杆图层
   * @returns 电线杆图层列表
   */
  @computed
  public get currentMapAllEntityLayers() {
    return this.currentMapIndex ? Array.from(this.entityLayer.values()) : [];
  }

  /**
   * 获取当前地图的电线杆连接图层
   */
  @computed
  public get currentConnectionLayer(): ElectricPoleConnectionLayer | null {
    if (!this.currentMapIndex) return null;
    return this.connectionLayer.get(this.currentMapIndex) ?? null;
  }

  /**
   * 根据位置坐标创建电线杆实体
   * @param mapIndex 地图索引
   * @param position 位置坐标
   * @returns 电线杆实体
   */
  public createElectricPoleEntity(mapIndex: MapIndex, position: Coordinate) {
    const xyzPosition = crd2xyz(position, mapIndex);
    const data: ElectricPoleData = {
      levelLogicId: this.generateLevelLogicId(),
      entityDataIdKey: ElectricPoleIdKey,
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: xyzPosition,
      connections: {
        from: null,
        to: null,
      },
      is_electric_pole: true,
      used_for_quest: false,
      state: 0,
      option_interact: 0,
    };
    return this.addElectricPoleEntity(mapIndex, data);
  }

  /**
   * 生成逻辑ID
   * @returns 逻辑ID
   */
  private generateLevelLogicId(): number {
    const maxId = 100_000_000;
    const existingIds = this.currentData.map((data) => data.levelLogicId);
    const newId = Math.floor(Math.random() * maxId);
    if (existingIds.includes(newId)) {
      return this.generateLevelLogicId();
    }
    return newId;
  }

  /**
   * 删除电线杆实体
   * @param mapIndex 地图索引
   * @param id 逻辑ID
   */
  public deleteElectricPoleEntity(mapIndex: MapIndex, id: number) {
    const entityLayer = this.entityLayer.get(mapIndex);
    const connectionLayer = this.connectionLayer.get(mapIndex);
    const zoneLayer = this.zoneLayer.get(mapIndex);
    if (!entityLayer || !connectionLayer || !zoneLayer) {
      logger.error('[ElectricPoleController|deleteElectricPoleEntity] Entity / connection / zone layer not found', { mapIndex, id });
      return false;
    }
    const feature = entityLayer.entity.getFeatureById(id);
    if (!feature) {
      logger.error('[ElectricPoleController|deleteElectricPoleEntity] Feature not found', { mapIndex, id });
      return false;
    }

    // 删除前，先清理与该电线杆相关的所有连线关系
    entityLayer.entity.features.getArray().forEach((otherFeature) => {
      if (otherFeature === feature) return;

      // 其他电线杆的 to 指向被删除电线杆：需要断开该连线（清理连线 geometry 和数据）
      if (otherFeature.data.connections.to === id) {
        otherFeature.clearConnectionTo();
      }

      // 其他电线杆的 from 指向被删除电线杆：仅清理引用关系
      if (otherFeature.data.connections.from === id) {
        otherFeature.clearConnectionFrom();
      }
    });

    // 删除电线杆自身的实体、连线 Feature 和覆盖区域
    entityLayer.entity.removeFeature(feature);
    connectionLayer.removeFeature(feature.connectionFeature);
    zoneLayer.removeZoneById(id);
    return true;
  }
}
