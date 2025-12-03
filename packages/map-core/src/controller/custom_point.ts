import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { CustomPointKey, MapIndex } from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { CustomPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/custom_point';
import type { CustomPointData, CustomPointIdKey, CustomPointMapData } from '@endfieldmap/map-core/types';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { calculateXYZDistance, crd2xyz, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export interface CustomPointControllerConfig {
  data?: CustomPointMapData;
  icon: {
    imagePath: string;
    size?: number;
  };
}

export class CustomPointController {
  @observable accessor entityLayer: Map<MapIndex, CustomPointEntityLayer> = new Map();
  @observable accessor customPointVisible: boolean = true;
  public layerContainer: CustomPointEntityLayer | null = null;
  private currentMapIndex?: MapIndex;

  private config: CustomPointControllerConfig;

  constructor(config: CustomPointControllerConfig) {
    this.config = config;
    if (config.data) {
      this.loadCustomPointData(config.data);
    }
  }

  /**
   * 初始化地图自定义标点图层
   * @param mapIndex 地图索引
   * @param data 自定义标点数据列表
   */
  public initMapCustomPointLayers(mapIndex: MapIndex, data: CustomPointData[]) {
    const layer = new CustomPointEntityLayer({
      data: data,
      icon: this.config.icon,
      mapIndex,
    });
    this.entityLayer.set(mapIndex, layer);

    // 应用当前的可见性设置
    layer.setVisible(this.customPointVisible);
  }

  /**
   * 切换地图自定义标点图层
   * @param mapIndex 地图索引
   */
  public switchMapCustomPointLayers(mapIndex: MapIndex) {
    // 如果图层不存在，直接创建空图层
    if (!this.entityLayer.has(mapIndex)) {
      this.initMapCustomPointLayers(mapIndex, []);
    }

    this.currentMapIndex = mapIndex;

    const entityLayer = this.entityLayer.get(mapIndex);
    if (entityLayer) {
      this.layerContainer = entityLayer;
    }
  }

  @action
  public setCustomPointVisible(visible: boolean) {
    this.customPointVisible = visible;
    this.entityLayer.forEach((layer) => {
      layer.setVisible(visible);
    });
  }

  @computed
  public get currentData() {
    if (!this.currentMapIndex) return [];
    const layer = this.entityLayer.get(this.currentMapIndex);
    return layer?.entity?.data ?? [];
  }

  @computed
  public get allData(): CustomPointMapData {
    const data: Partial<CustomPointMapData> = {};
    this.entityLayer.forEach((layer, mapIndex) => {
      data[mapIndex] = layer.entity.data;
    });
    return data as CustomPointMapData;
  }

  public addCustomPointEntity(mapIndex: MapIndex, data: CustomPointData) {
    // 如果图层不存在，先初始化
    const layerJustCreated = !this.entityLayer.has(mapIndex);
    if (layerJustCreated) {
      this.initMapCustomPointLayers(mapIndex, []);
      // 如果是刚创建的图层，需要更新 layerContainer
      this.layerContainer = this.entityLayer.get(mapIndex) || null;
    }

    const entityLayer = this.entityLayer.get(mapIndex);
    if (!entityLayer) {
      logger.error('[CustomPointController|addCustomPointEntity] Entity layer not found', { mapIndex });
      return null;
    }

    const feature = entityLayer.entity.addCustomPointEntity(data);
    this.notifyCustomPointChanged();
    return feature;
  }

  public deleteCustomPointEntity(mapIndex: MapIndex, id: number) {
    // 如果图层不存在，先初始化
    if (!this.entityLayer.has(mapIndex)) {
      this.initMapCustomPointLayers(mapIndex, []);
    }

    const entityLayer = this.entityLayer.get(mapIndex);
    if (!entityLayer) {
      logger.error('[CustomPointController|deleteCustomPointEntity] Entity layer not found', { mapIndex, id });
      return false;
    }
    const feature = entityLayer.entity.getFeatureById(id);
    if (!feature) {
      logger.error('[CustomPointController|deleteCustomPointEntity] Feature not found', { mapIndex, id });
      return false;
    }
    entityLayer.entity.removeFeature(feature);
    this.notifyCustomPointChanged();
    return true;
  }

  private notifyCustomPointChanged() {
    mapEventEmitter.fire(MAP_EVENT.CUSTOM_POINT_CHANGED, {
      mapIndex: this.currentMapIndex ?? null,
    });
  }

  /**
   * 初始化自定义标点数据（会重新生成ID）
   * @param data 自定义标点数据
   */
  public initCustomPointData(data: CustomPointMapData) {
    // 全局已使用的 levelLogicId 集合
    const globalUsedIds = new Set<number>();

    // 将当前已存在图层中的 ID 也加入集合
    this.entityLayer.forEach((layer) => {
      layer.entity.data.forEach((point) => {
        globalUsedIds.add(point.levelLogicId);
      });
    });

    Object.entries(data).forEach(([mapIndexKey, list]) => {
      const mapIndex = mapIndexKey as MapIndex;
      const pointList = list as CustomPointData[];

      // 为当前地图上的每一根自定义标点重新生成唯一的 levelLogicId
      const idMap = new Map<number, number>();

      for (const point of pointList) {
        const oldId = point.levelLogicId;
        const newId = this.generateCustomPointId(mapIndex, globalUsedIds);
        idMap.set(oldId, newId);
        globalUsedIds.add(newId);
      }

      const remappedList: CustomPointData[] = pointList.map((point) => {
        const oldId = point.levelLogicId;
        const newId = idMap.get(oldId)!;

        return {
          ...point,
          levelLogicId: newId,
        };
      });

      this.initMapCustomPointLayers(mapIndex, remappedList);
    });
    this.notifyCustomPointChanged();
  }

  /**
   * 加载自定义标点数据（不重新生成 ID）
   * @param data 自定义标点数据
   */
  public loadCustomPointData(data: CustomPointMapData) {
    Object.entries(data).forEach(([mapIndexKey, list]) => {
      const mapIndex = mapIndexKey as MapIndex;
      const pointList = list as CustomPointData[];
      this.initMapCustomPointLayers(mapIndex, pointList);
    });
    this.notifyCustomPointChanged();
  }

  /**
   * 根据位置坐标创建自定义标点实体
   * @param mapIndex 地图索引
   * @param position 位置坐标
   * @param type 自定义标点类型
   * @returns 自定义标点实体
   */
  public createCustomPointEntity(mapIndex: MapIndex, position: Coordinate, type: CustomPointIdKey) {
    const xyzPosition = crd2xyz(position, mapIndex);

    // 检查半径 10 范围内是否已存在标点
    const entityLayer = this.entityLayer.get(mapIndex);
    if (entityLayer) {
      const features = entityLayer.entity.features;
      const duplicateRadius = 10;

      for (const feature of features) {
        const existingPos = feature.data.position;
        const distance = calculateXYZDistance(xyzPosition, existingPos);

        if (distance < duplicateRadius) {
          // TODO: i18n
          throw new Error(
            `[CustomPointController|createCustomPointEntity] duplicate custom point at ${position} (distance: ${distance})`
          );
        }
      }
    }

    const data: CustomPointData = {
      levelLogicId: this.generateCustomPointId(mapIndex),
      entityDataIdKey: type,
      templateId: CustomPointKey,
      entityType: '#CustomPoint',
      position: xyzPosition,
      properties: {},
    };

    return this.addCustomPointEntity(mapIndex, data);
  }

  /**
   * 生成自定义标点ID
   * @param mapIndex 地图索引
   * @param usedIds 已使用的ID集合
   */
  private generateCustomPointId(mapIndex: MapIndex, usedIds?: Set<number>): number {
    const existingIds = usedIds ?? new Set(this.entityLayer.get(mapIndex)?.entity.features.map((f) => f.id) ?? []);
    // 自定义标点 ID 范围：200,000,000 - 300,000,000
    const MIN_ID = 200_000_000;
    const MAX_ID = 300_000_000;
    return IdGenerator.generate(existingIds, MIN_ID, MAX_ID);
  }
}
