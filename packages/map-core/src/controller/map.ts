import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldMap } from '@endfieldmap/map-core/render/map';
import type { MapConfig } from '@endfieldmap/map-core/types/map';
import type { Coordinate } from 'ol/coordinate';
import { HoverFeatureController } from '@endfieldmap/map-core/controller/hover_feature';
import { HoverConnectionController } from '@endfieldmap/map-core/controller/hover_connection';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';

export interface MapControllerConfig {
  mapConfig: Omit<MapConfig, 'mapImageUrl'>;
  asset: EndfieldMapAsset;
}

export interface MapControllerDependencies {
  getEntityLayers: () => CommonPointEntityLayer[];
  getElectricPoleLayers: () => ElectricPoleEntityLayer[];
  getConnectionLayer: () => ElectricPoleConnectionLayer | null;
}

export class MapController {
  public mapRenderer: EndfieldMap;
  public hoverFeatureController: HoverFeatureController;
  public hoverConnectionController: HoverConnectionController;

  constructor(config: MapControllerConfig, dependencies?: MapControllerDependencies) {
    const { mapConfig, asset } = config;
    this.mapRenderer = new EndfieldMap({
      ...mapConfig,
      mapImageUrl: asset.mapImage,
    });
    this.hoverFeatureController = new HoverFeatureController({
      getEntityLayers: dependencies?.getEntityLayers || (() => []),
      getElectricPoleLayers: dependencies?.getElectricPoleLayers || (() => []),
      disableHoverFeature: mapConfig.disableHoverFeature,
    });
    this.hoverConnectionController = new HoverConnectionController({
      getConnectionLayer: dependencies?.getConnectionLayer || (() => null),
      disableHoverConnection: mapConfig.disableHoverFeature,
    });
    this.registerEventHandler();
  }

  private registerEventHandler() {
    mapEventEmitter.on(MAP_EVENT.CLUSTER_CLICK, (event) => {
      const { extent } = event;
      this.mapRenderer.view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
    });
  }

  /**
   * 设置地图中心点
   * @param center 中心点
   */
  public setCenter(center: Coordinate) {
    this.mapRenderer.view.setCenter(center);
  }

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   */
  public setZoom(zoom: number) {
    this.mapRenderer.view.setZoom(zoom);
  }

  /**
   * 获取选择交互
   * @returns 选择交互
   */
  public get selection() {
    return this.mapRenderer.selection;
  }

  /**
   * 设置是否启用hover feature
   * @param enable 是否启用
   */
  public setHoverFeatureEnable(enable: boolean) {
    this.hoverFeatureController.setEnable(enable);
    this.hoverConnectionController.setEnable(enable);
  }

  /**
   * 销毁控制器，清理资源
   */
  public dispose() {
    this.hoverFeatureController.dispose();
    this.hoverConnectionController.dispose();
  }
}
