import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { DataInstance, MapEventEmitter } from '@endfieldmap/map-core/types/event';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import { ActiveFeatureController } from '@endfieldmap/map-adapter-maplibre/controller/active_feature_controller';
import { CustomPointController } from '@endfieldmap/map-adapter-maplibre/controller/custom_point_controller';
import { ElectricPoleController } from '@endfieldmap/map-adapter-maplibre/controller/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-adapter-maplibre/controller/entity_controller';
import { HoverConnectionController } from '@endfieldmap/map-adapter-maplibre/controller/hover_connection_controller';
import { HoverFeatureController } from '@endfieldmap/map-adapter-maplibre/controller/hover_feature_controller';
import { MapController } from '@endfieldmap/map-adapter-maplibre/controller/map_controller';
import { TierController } from '@endfieldmap/map-adapter-maplibre/controller/tier_controller';
import type { MapLibreAdapterConfig } from '@endfieldmap/map-adapter-maplibre/types';

/**
 * MapLibre Native 地图适配器
 *
 * 实现 IMapAdapter 接口，为 React Native 提供地图数据管理能力。
 * 不直接操作 MapLibre 实例，而是通过 MobX 可观察状态驱动
 * React 组件完成实际渲染。
 */
export class MapLibreAdapter {
  public readonly asset: EndfieldMapAsset;
  public readonly mapController: MapController;
  public readonly entityController: EntityController;
  public readonly electricPoleController: ElectricPoleController;
  public readonly customPointController: CustomPointController;
  public readonly tierController: TierController;
  public readonly activeFeatureController: ActiveFeatureController;
  public readonly hoverFeatureController: HoverFeatureController;
  public readonly hoverConnectionController: HoverConnectionController;
  public readonly event: EndfieldMapEmitter<MapEventEmitter>;

  @observable accessor enableHover = false;
  @observable accessor hoverDebounceTime = 0;

  constructor(config: MapLibreAdapterConfig) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }

    this.event = new EndfieldMapEmitter<MapEventEmitter>();
    this.asset = new EndfieldMapAsset(config.asset);

    this.mapController = new MapController({ data: config.data });
    this.mapController.updateTileUrl(this.asset.mapImage);

    const mapDataManager = this.mapController.dataManager;

    this.entityController = new EntityController({ mapDataManager });
    this.electricPoleController = new ElectricPoleController({ mapDataManager });
    this.customPointController = new CustomPointController({ mapDataManager });
    this.tierController = new TierController({ mapDataManager });
    this.activeFeatureController = new ActiveFeatureController();
    this.hoverFeatureController = new HoverFeatureController();
    this.hoverConnectionController = new HoverConnectionController();
  }

  @action
  renderMap(mapId: MapData['id']): void {
    this.mapController.renderMap(mapId);
    this.mapController.updateTileUrl(this.asset.mapImage);
    this.activeFeatureController.clearActiveFeature();
    this.tierController.clearTier();
  }

  renderAreaName(_zoom?: number): void {
    // 原生端区域名称由 React 组件根据 zoom 自行渲染
  }

  setActiveFeatureEnable(enable: boolean): void {
    this.activeFeatureController.setEnable(enable);
  }

  @action
  setHoverFeatureEnable(enable: boolean): void {
    this.enableHover = enable;
    this.hoverFeatureController.setEnable(enable);
    this.hoverConnectionController.setEnable(enable);
  }

  @action
  setHoverDebounceTime(time: number): void {
    this.hoverDebounceTime = time;
    this.hoverFeatureController.setDebounceTime(time);
    this.hoverConnectionController.setDebounceTime(time);
  }

  setClusterEnable(enable: boolean): void {
    this.entityController.setClusterEnable(enable);
  }

  async moveToEntity(
    entityId: string | number,
    autoToggleVisible = true,
    autoSetActive = false,
    animationTime = 1000,
    zoom?: number
  ): Promise<void> {
    const id = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
    if (isNaN(id)) {
      logger.warn('[MapLibreAdapter] Invalid entity ID:', entityId);
      return;
    }

    let targetInstance: EntityDataInstance | ElectricPoleDataInstance | CustomPointDataInstance | undefined;
    const mapIds = this.mapController.dataManager.mapIds;

    for (const mapId of mapIds) {
      const instance = this.entityController.getInstanceById(mapId, id);
      if (instance) {
        targetInstance = instance;
        break;
      }
    }

    if (!targetInstance) {
      for (const mapId of mapIds) {
        const manager = this.electricPoleController.dataManager.getMapManager(mapId);
        const instance = manager.getById(id);
        if (instance) {
          targetInstance = instance;
          break;
        }
      }
    }

    if (!targetInstance) {
      for (const mapId of mapIds) {
        const manager = this.customPointController.dataManager.getMapManager(mapId);
        const instance = manager.getById(id);
        if (instance) {
          targetInstance = instance;
          break;
        }
      }
    }

    if (!targetInstance) {
      logger.warn(`[MapLibreAdapter] Entity ${id} not found.`);
      return;
    }

    await this.moveToEntityInstance(targetInstance, autoToggleVisible, autoSetActive, animationTime, zoom);
  }

  async moveToEntityInstance(
    instance: DataInstance,
    autoToggleVisible = true,
    autoSetActive = false,
    animationTime = 1000,
    zoom?: number
  ): Promise<void> {
    const targetMapId = instance.mapId;
    const entityType = instance.entityType;

    if (this.mapController.dataManager.currentMapId !== targetMapId) {
      this.renderMap(targetMapId);
    }

    if (autoToggleVisible) {
      if (entityType === '#ElectricPole') {
        this.electricPoleController.setVisible(true);
        this.electricPoleController.setZoneVisible(true);
      } else if (entityType === '#CustomPoint') {
        this.customPointController.setCustomPointVisible(true);
      } else {
        const entityInstance = instance as EntityDataInstance;
        this.entityController.setGroupVisibility(entityInstance.mapId, entityInstance.entityDataIdKey, true);
      }
    }

    if (autoSetActive) {
      this.activeFeatureController.setActiveFeature(instance);
    }

    const center = instance.coordinates;
    if (center) {
      this.mapController.view.animate({
        center,
        zoom: zoom ?? this.mapController.view.getZoom(),
        duration: animationTime,
      });
    }
  }

  dispose(): void {
    this.activeFeatureController.dispose();
    this.hoverFeatureController.dispose();
    this.hoverConnectionController.dispose();
    this.tierController.dispose();
    this.mapController.dispose();
  }
}
