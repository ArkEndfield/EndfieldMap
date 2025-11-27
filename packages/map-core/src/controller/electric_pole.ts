import { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';
import { ElectricPoleZoneLayer } from '@endfieldmap/map-core/render/layers/electric_pole_zone';
import type { ElectricPoleData, ElectricPoleDataList, ElectricPoleMapData } from '@endfieldmap/map-core/types';
import { ELECTRIC_ZONE_RADIUS, ElectricPoleIdKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { MultiLayerContainer } from '@endfieldmap/map-core/render/layers/multi_layer_container';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';
import { calculateXYZDistance, crd2xyz, logger } from '@endfieldmap/tools';
import type { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';

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
  @observable accessor zoneVisible: boolean = true;
  @observable accessor electricPoleVisible: boolean = true;

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
  public initMapElectricPoleLayers(mapIndex: MapIndex, data: ElectricPoleDataList, notifyChange: boolean = false) {
    const entityLayer = new ElectricPoleEntityLayer({
      data: data,
      mapIndex: mapIndex,
      icon: {
        url: `${this.imagePath}/electric_pole.png`,
        // TODO: 电线杆图标尺寸
        size: 52,
      },
    });
    const connectionLayer = new ElectricPoleConnectionLayer({
      mapIndex: mapIndex,
    });
    const zoneLayer = new ElectricPoleZoneLayer({
      data: data,
      mapIndex: mapIndex,
      radius: ELECTRIC_ZONE_RADIUS,
    });

    entityLayer.entity.features.forEach((feature) => {
      connectionLayer.addFeature(feature.connectionFeature);
    });

    this.entityLayer.set(mapIndex, entityLayer);
    this.connectionLayer.set(mapIndex, connectionLayer);
    this.zoneLayer.set(mapIndex, zoneLayer);
    
    // 应用当前的可见性设置
    zoneLayer.setVisible(this.zoneVisible && this.electricPoleVisible);
    entityLayer.setVisible(this.electricPoleVisible);
    connectionLayer.setVisible(this.electricPoleVisible);
    
    // 初始化时，根据数据中的 connections 信息补全连接状态与连线几何
    this.syncAllElectricPoleConnections(mapIndex);
    if (notifyChange) {
      this.notifyElectricPoleChanged();
    }
  }

  /**
   * 初始化电线杆数据
   * @param data 电线杆数据
   */
  public initElectricPoleData(data: ElectricPoleMapData) {
    // 全局已使用的 levelLogicId 集合，用于保证本次重映射过程中所有电线杆 ID 全局唯一
    const globalUsedIds = new Set<number>();

    // 将当前已存在图层中的 ID 也加入集合，避免与已有数据冲突（如果此前已经初始化过）
    this.entityLayer.forEach((layer) => {
      layer.entity.data.forEach((pole) => {
        globalUsedIds.add(pole.levelLogicId);
      });
    });

    Object.entries(data).forEach(([mapIndexKey, list]) => {
      const mapIndex = mapIndexKey as MapIndex;
      const poleList = list as ElectricPoleDataList;

      // 为当前地图上的每一根电线杆重新生成唯一的 levelLogicId，
      // 并在同一张地图内构建 oldId -> newId 的映射，用于修正 connectTo。
      const idMap = new Map<number, number>();

      for (const pole of poleList) {
        const oldId = pole.levelLogicId;
        const newId = this.generateLevelLogicId(globalUsedIds);
        idMap.set(oldId, newId);
        // 记录到全局集合，保证后续生成的 ID 不会与当前已生成的重复
        globalUsedIds.add(newId);
      }

      const remappedList: ElectricPoleDataList = poleList.map((pole) => {
        const oldId = pole.levelLogicId;
        const newId = idMap.get(oldId)!;

        let newConnectTo: ElectricPoleData['levelLogicId'] | null = null;
        if (pole.properties.connectTo != null) {
          const mapped = idMap.get(pole.properties.connectTo);
          if (mapped != null) {
            newConnectTo = mapped;
          } else {
            // 如果找不到对应的目标电线杆，说明原数据不完整，直接断开连接并打日志
            logger.warn('[ElectricPoleController|initElectricPoleData] connectTo target not found after remap', {
              mapIndex,
              from: oldId,
              to: pole.properties.connectTo,
            });
            newConnectTo = null;
          }
        }

        return {
          ...pole,
          levelLogicId: newId,
          properties: {
            ...pole.properties,
            connectTo: newConnectTo,
          }
        };
      });

      this.initMapElectricPoleLayers(mapIndex, remappedList);
    });
    this.notifyElectricPoleChanged();
  }

  /**
   * 重置所有地图上的电线杆数据
   * - 清空现有的电线杆图层与数据
   * - 使用新的 ElectricPoleMapData 重新初始化
   */
  public resetAllElectricPoleData(data: ElectricPoleMapData) {
    // 清空现有图层和状态
    this.entityLayer.clear();
    this.connectionLayer.clear();
    this.zoneLayer.clear();
    this.layerContainer = null;
    this.currentMapIndex = undefined;

    // 使用新的数据重新初始化
    this.initElectricPoleData(data);
    this.notifyElectricPoleChanged();
  }

  /**
   * 切换地图图层
   * @param mapIndex 地图索引
   */
  public switchMapElectricPoleLayers(mapIndex: MapIndex) {
    // 如果 entity / connection / zone 图层不存在，直接创建空图层
    if (!this.entityLayer.has(mapIndex) || !this.connectionLayer.has(mapIndex) || !this.zoneLayer.has(mapIndex)) {
      this.initMapElectricPoleLayers(mapIndex, []);
    }

    this.currentMapIndex = mapIndex;

    const entityLayer = this.entityLayer.get(mapIndex);
    const connectionLayer = this.connectionLayer.get(mapIndex);
    const zoneLayer = this.zoneLayer.get(mapIndex);

    if (entityLayer && connectionLayer && zoneLayer) {
      // 每次切换地图时，根据目标地图重建 layerContainer，保证展示正确
      this.layerContainer = new MultiLayerContainer([zoneLayer.layer, connectionLayer.layer, entityLayer.layer]);
    }
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

    // 新增时，同步该电线杆与其他电线杆之间的连接关系
    this.syncElectricPoleConnections(mapIndex, feature);

    // 数据变化事件
    this.notifyElectricPoleChanged();

    return feature;
  }

  /**
   * 获取当前地图的电线杆数据
   * @returns 电线杆数据列表
   */
  @computed
  public get currentData() {
    return this.currentMapIndex ? (this.entityLayer.get(this.currentMapIndex)?.entity?.data ?? []) : [];
  }

  @computed
  public get allData(): ElectricPoleMapData {
    const data: Partial<ElectricPoleMapData> = {};

    this.entityLayer.forEach((layer, mapIndex) => {
      data[mapIndex] = layer.entity.data;
    });

    return data as ElectricPoleMapData;
  }

  /**
   * 获取当前地图的所有电线杆图层
   * @returns 电线杆图层列表
   */
  @computed
  public get currentMapAllEntityLayers(): ElectricPoleEntityLayer[] {
    if (!this.currentMapIndex) {
      return [];
    }
    const layer = this.entityLayer.get(this.currentMapIndex);
    return layer ? [layer] : [];
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
    
    // 检查半径 0.1 范围内是否已存在电线杆
    const entityLayer = this.entityLayer.get(mapIndex);
    if (entityLayer) {
      const features = entityLayer.entity.features.getArray();
      // TODO: 电线杆创建距离限制
      const duplicateRadius = 10;
      
      for (const feature of features) {
        const existingPos = feature.data.position;
        const distance = calculateXYZDistance(xyzPosition, existingPos);

        if (distance < duplicateRadius) {
          // TODO: i18n
          throw new Error(`[ElectricPoleController|createElectricPoleEntity] duplicate electric pole at ${position} (distance: ${distance})`)
        }
      }
    }
    
    const data: ElectricPoleData = {
      levelLogicId: this.generateLevelLogicId(),
      entityDataIdKey: ElectricPoleIdKey,
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: xyzPosition,
      properties: {
        connectTo: null,
      }
    };
    return this.addElectricPoleEntity(mapIndex, data);
  }

  /**
   * 生成逻辑ID
   * @returns 逻辑ID
   */
  private generateLevelLogicId(usedIds?: Set<number>): number {
    const maxId = 100_000_000;
    // 如果调用方传入了已使用 ID 集合，则在该集合基础上生成；
    // 否则默认使用当前地图已有的数据进行去重（兼容旧用法，例如 createElectricPoleEntity）。
    const existingSet = usedIds ?? new Set(this.currentData.map((data) => data.levelLogicId));

    // 使用循环而不是递归，避免极端情况下的递归深度问题
    // 在 maxId 足够大的前提下，出现碰撞的概率极低。
    // 同时在 initElectricPoleData 中通过传入全局 usedIds，保证本次批量生成期间绝不重复。

    while (true) {
      const newId = Math.floor(Math.random() * maxId);
      if (!existingSet.has(newId)) {
        return newId;
      }
    }
  }

  /**
   * 同步当前地图上所有电线杆的连接关系
   * - 根据每个 ElectricPoleFeature.data.connections 中的 from / to
   *   建立 feature 之间的互相引用与连线几何
   */
  private syncAllElectricPoleConnections(mapIndex: MapIndex) {
    const entityLayer = this.entityLayer.get(mapIndex);
    if (!entityLayer) return;

    const features = entityLayer.entity.features.getArray();
    features.forEach((feature) => {
      this.syncElectricPoleConnections(mapIndex, feature);
    });
  }

  /**
   * 同步单个电线杆的连接关系
   * - 若 data.connections.from 存在：让 from 电线杆 connectTo 当前电线杆
   * - 若 data.connections.to 存在：让当前电线杆 connectTo to 电线杆
   * 这样可以保证：
   *   1. ElectricPoleData.connections 双端数据一致
   *   2. ElectricPoleFeature.connectionEntityFeatures 与 ConnectionFeature 几何保持同步
   */
  private syncElectricPoleConnections(mapIndex: MapIndex, feature: ElectricPoleFeature) {
    const entityLayer = this.entityLayer.get(mapIndex);
    if (!entityLayer) return;

    const { connectTo } = feature.data?.properties ?? {};

    // 处理 to：当前电线杆指向某个电线杆
    if (connectTo != null) {
      const toFeature = entityLayer.entity.getFeatureById(connectTo);
      if (!toFeature) {
        logger.warn('[ElectricPoleController|syncElectricPoleConnections] `to` feature not found', {
          mapIndex,
          connectTo,
          currentId: feature.data.levelLogicId,
        });
      } else {
        // 若当前还未建立连接或连接目标不一致，则重建连接
        if (
          !feature.connectionEntityFeatures.to ||
          feature.connectionEntityFeatures.to.data.levelLogicId !== connectTo
        ) {
          feature.connectTo(toFeature);
        }
      }
    }
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
      logger.error('[ElectricPoleController|deleteElectricPoleEntity] Entity / connection / zone layer not found', {
        mapIndex,
        id,
      });
      return false;
    }
    const feature = entityLayer.entity.getFeatureById(id);
    if (!feature) {
      logger.error('[ElectricPoleController|deleteElectricPoleEntity] Feature not found', { mapIndex, id });
      return false;
    }

    // 删除前，先清理与该电线杆相关的所有连线关系
    feature.clearConnectionTo();
    feature.clearConnectionFrom();

    // 删除电线杆自身的实体、连线 Feature 和覆盖区域
    entityLayer.entity.removeFeature(feature);
    connectionLayer.removeFeature(feature.connectionFeature);
    zoneLayer.removeZoneById(id);
    // 数据变化事件
    this.notifyElectricPoleChanged();
    return true;
  }

  /**
   * 触发电线杆数据变化事件
   */
  private notifyElectricPoleChanged() {
    mapEventEmitter.fire(MAP_EVENT.ELECTRIC_POLE_CHANGED, {
      mapIndex: this.currentMapIndex ?? null,
    });
  }

  /**
   * 设置所有地图的 zone 图层可见性
   */
  @action
  public setZoneVisible(visible: boolean) {
    this.zoneVisible = visible;
    this.zoneLayer.forEach((layer) => {
      layer.setVisible(visible && this.electricPoleVisible);
    });
  }

  /**
   * 切换 zone 图层可见性
   */
  public toggleZoneVisible() {
    this.setZoneVisible(!this.zoneVisible);
  }

  /**
   * 设置所有地图的电线杆可见性（包括实体、连线和范围）
   */
  @action
  public setElectricPoleVisible(visible: boolean) {
    this.electricPoleVisible = visible;
    this.entityLayer.forEach((layer) => {
      layer.setVisible(visible);
    });
    this.connectionLayer.forEach((layer) => {
      layer.setVisible(visible);
    });
    this.zoneLayer.forEach((layer) => {
      layer.setVisible(visible && this.zoneVisible);
    });
  }

  /**
   * 切换电线杆可见性
   */
  public toggleElectricPoleVisible() {
    this.setElectricPoleVisible(!this.electricPoleVisible);
  }
}
