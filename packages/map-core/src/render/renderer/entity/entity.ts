import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const';
import { EntityMapDataManager } from '@endfieldmap/map-core/data';
import type { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { EntityGroupRenderer } from '@endfieldmap/map-core/render/renderer';
import type { EntityData, MapData } from '@endfieldmap/map-core/types';
import type VectorLayer from 'ol/layer/Vector';

export interface EntityRenderConfig {
  dataManager: EntityMapDataManager;
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: EndfieldMapAsset;
}

export class EntityRender {
  // public renders: EntityGroupRenderer[] = [];
  public renders: Map<MapData['id'], Map<EntityData['entityDataIdKey'], EntityGroupRenderer>>;

  private dataManager: EntityMapDataManager;
  private mapDataManager: MapDataManager;
  private mapInstance: EndfieldMap;
  private asset: EndfieldMapAsset;

  /** 当前已添加到地图的图层 */
  private currentLayers: VectorLayer[] = [];

  constructor(config: EntityRenderConfig) {
    this.dataManager = config.dataManager;
    this.mapDataManager = config.mapDataManager;
    this.mapInstance = config.mapInstance;
    this.asset = config.asset;
    this.renders = new Map();
    this.mapDataManager.data.forEach((item) => {
      this.renders.set(item.id, new Map());
    });
  }

  /** 清除当前图层 */
  public clearLayer(): void {
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];
  }

  public render() {
    const currentMapId = this.mapDataManager.currentMapId;
    const groupManagers = this.dataManager.getMapGroupManagerList(currentMapId);
    const mapRenderer = this.renders.get(currentMapId)!;

    // 清除旧图层
    this.clearLayer();

    // 如果 mapRenderer 有内容，直接添加图层
    if (mapRenderer.size > 0) {
      for (const renderer of mapRenderer.values()) {
        this.mapInstance.map.addLayer(renderer.layer);
        this.currentLayers.push(renderer.layer);
      }
      return;
    }

    // 创建新的渲染器并添加图层
    const imagePath = this.asset.entityImage;
    for (const manager of groupManagers) {
      const renderer = new EntityGroupRenderer({
        dataManager: manager,
        iconPath: `${imagePath}/${manager.iconName}.png`,
        enableCluster: !this.dataManager.disableCluster,
        clusterDistance: this.dataManager.clusterDistance,
        markedFilterMode: this.dataManager.markedFilterMode,
      });
      mapRenderer.set(manager.entityDataIdKey, renderer);
      this.mapInstance.map.addLayer(renderer.layer);
      this.currentLayers.push(renderer.layer);
    }
  }

  public updateMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    const mapRenderer = this.renders.get(this.mapDataManager.currentMapId)!;
    for (const renderer of mapRenderer.values()) {
      renderer.setMarkedFilterMode(mode);
    }
  }

  public setClusterDistance(distance: number): void {
    const mapRenderer = this.renders.get(this.mapDataManager.currentMapId)!;
    for (const renderer of mapRenderer.values()) {
      renderer.setClusterDistance(distance);
    }
  }

  public get currentRenderer() {
    return Array.from(this.renders.get(this.mapDataManager.currentMapId)?.values() || []);
  }
}
