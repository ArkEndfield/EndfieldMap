import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { MapIndex } from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { CustomPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/custom_point';
import type { CustomPointData, CustomPointMapData } from '@endfieldmap/map-core/types';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

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
      this.initLayers(config.data);
    }
  }

  private initLayers(data: CustomPointMapData) {
    Object.entries(data).forEach(([mapIndexKey, list]) => {
      const mapIndex = mapIndexKey as MapIndex;
      this.initMapCustomPointLayers(mapIndex, list);
    });
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

  public updateData(data: CustomPointMapData) {
    // 清除现有图层
    this.entityLayer.clear();
    // 重新初始化
    this.initLayers(data);
  }
}
