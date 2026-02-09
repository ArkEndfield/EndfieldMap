import { CustomPointMapDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_map_data_manager';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { CustomPointRenderer } from '@endfieldmap/map-core/render/renderer/entity/custom_point/custom_point_renderer';
import type { MapData } from '@endfieldmap/map-core/types';
import VectorLayer from 'ol/layer/Vector';

export interface CustomPointRenderConfig {
  dataManager: CustomPointMapDataManager;
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: { entityImage: string };
}

export class CustomPointRender {
  public renderInstances: Map<MapData['id'], CustomPointRenderer> = new Map();
  private renderInstance: VectorLayer | null = null;
  private mapDataManager: MapDataManager;
  private mapInstance: EndfieldMap;

  constructor(config: CustomPointRenderConfig) {
    this.mapDataManager = config.mapDataManager;
    this.mapInstance = config.mapInstance;
    this.mapDataManager.data.forEach((item) => {
      this.renderInstances.set(
        item.id,
        new CustomPointRenderer({
          dataManager: config.dataManager.getMapManager(item.id),
          iconSize: 20, // TODO: 以后调整
          asset: config.asset,
        })
      );
    });
  }

  /** 渲染地图 */
  public render(mapId: MapData['id']) {
    const customPointInstance = this.getCustomPointInstance(mapId);
    if (customPointInstance) {
      this.clearLayer();
      this.mapInstance.map.addLayer(customPointInstance.layer);
      this.renderInstance = customPointInstance.layer;
    }
  }

  public getCustomPointInstance(mapId: MapData['id']) {
    const instance = this.renderInstances.get(mapId);
    if (!instance) {
      throw new Error(`CustomPointRender: current map ${mapId} not found`);
    }
    return instance;
  }

  /** 获取当前地图 */
  public get currentCustomPointInstance() {
    return this.getCustomPointInstance(this.mapDataManager.currentMapId);
  }

  /**
   * 设置可见性
   * @param visible 可见性
   */
  public setVisible(visible: boolean) {
    this.renderInstances.forEach((instance) => {
      instance.setVisible(visible);
    });
  }

  /** 清除图层 */
  public clearLayer() {
    if (this.renderInstance) {
      this.mapInstance.map.removeLayer(this.renderInstance);
      this.renderInstance = null;
    }
  }

  /** 释放资源 */
  public dispose() {
    this.clearLayer();
    this.renderInstances.forEach((instance) => {
      instance.dispose();
    });
  }
}
