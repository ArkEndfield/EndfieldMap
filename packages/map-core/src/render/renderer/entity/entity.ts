import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const';
import { EntityMapDataManager } from '@endfieldmap/map-core/data';
import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { EntityGroupRenderer } from '@endfieldmap/map-core/render/renderer';
import type { EntityData, MapData } from '@endfieldmap/map-core/types';
import type VectorLayer from 'ol/layer/Vector';

export class EntityRender {
  // public renders: EntityGroupRenderer[] = [];
  public renders: Map<MapData['id'], Map<EntityData['entityDataIdKey'], EntityGroupRenderer>>;

  private dataManager: EntityMapDataManager;

  /** 当前已添加到地图的图层 */
  private currentLayers: VectorLayer[] = [];

  constructor(dataManager: EntityMapDataManager) {
    this.dataManager = dataManager;
    const mapData = MapDataManager.getInstance();
    this.renders = new Map();
    mapData.data.forEach((item) => {
      this.renders.set(item.id, new Map());
    });
  }

  /** 清除当前图层 */
  public clearLayer(): void {
    const mapInstance = EndfieldMap.getInstance();
    for (const layer of this.currentLayers) {
      mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];
  }

  public render() {
    const mapDataManager = MapDataManager.getInstance();
    const asset = EndfieldMapAsset.getInstance();
    const currentMapId = mapDataManager.currentMapId;
    const groupManagers = this.dataManager.getMapGroupManagerList(currentMapId);
    const mapRenderer = this.renders.get(currentMapId)!;

    // 清除旧图层
    this.clearLayer();

    // 如果 mapRenderer 有内容，直接添加图层
    if (mapRenderer.size > 0) {
      const mapInstance = EndfieldMap.getInstance();
      for (const renderer of mapRenderer.values()) {
        mapInstance.map.addLayer(renderer.layer);
        this.currentLayers.push(renderer.layer);
      }
      return;
    }

    // 创建新的渲染器并添加图层
    const mapInstance = EndfieldMap.getInstance();
    for (const manager of groupManagers) {
      const renderer = new EntityGroupRenderer({
        dataManager: manager,
        iconPath: `${asset.entityImage}/${manager.iconName}.png`,
        enableCluster: !this.dataManager.disableCluster,
        clusterDistance: this.dataManager.clusterDistance,
        markedFilterMode: this.dataManager.markedFilterMode,
      });
      mapRenderer.set(manager.entityDataIdKey, renderer);
      mapInstance.map.addLayer(renderer.layer);
      this.currentLayers.push(renderer.layer);
    }
  }

  public updateMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    const mapDataManager = MapDataManager.getInstance();
    const mapRenderer = this.renders.get(mapDataManager.currentMapId)!;
    for (const renderer of mapRenderer.values()) {
      renderer.setMarkedFilterMode(mode);
    }
  }

  public setClusterDistance(distance: number): void {
    const mapDataManager = MapDataManager.getInstance();
    const mapRenderer = this.renders.get(mapDataManager.currentMapId)!;
    for (const renderer of mapRenderer.values()) {
      renderer.setClusterDistance(distance);
    }
  }

  public get currentRenderer() {
    const mapDataManager = MapDataManager.getInstance();
    return Array.from(this.renders.get(mapDataManager.currentMapId)?.values() || []);
  }
}
