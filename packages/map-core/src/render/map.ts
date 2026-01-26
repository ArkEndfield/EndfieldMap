import {
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  DEFAULT_ZOOM,
  LayerType,
  LayerTypeKey,
  MapType,
  MapTypeKey,
} from '@endfieldmap/map-core/const/map';
import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { MapData } from '@endfieldmap/map-core/types/map';
import { tileLoadFunction } from '@endfieldmap/map-core/utils/image';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';

export class MapRender {
  private renderInstances: Map<MapData['id'], SingleMapRender> = new Map();
  /** 图层实例 */
  public layer: TileLayer;
  private dataManager: MapDataManager;

  constructor() {
    this.dataManager = MapDataManager.getInstance();
    this.dataManager.data.forEach((item) => {
      this.renderInstances.set(item.id, new SingleMapRender(item));
    });

    this.layer = new TileLayer({
      preload: 2, // 预加载2个层级的瓦片，减少缩放时的闪烁
      useInterimTilesOnError: true, // 加载出错时使用临时瓦片
      zIndex: -2,
    });

    this.layer.set(LayerTypeKey, LayerType.MAP);
    this.layer.set(MapTypeKey, MapType.MAP);

    const mapInstance = EndfieldMap.getInstance();
    mapInstance.map.addLayer(this.layer);
  }

  /** 渲染地图 */
  public renderMap() {
    // this.currentMapInstance?.dispose?.();
    if (this.currentMapInstance) {
      this.currentMapInstance.render();
      this.layer.setSource(this.currentMapInstance.tileSource);
    }
  }

  /** 获取当前地图 */
  public get currentMapInstance() {
    const renderInstance = this.renderInstances.get(this.dataManager.currentMapId);
    return renderInstance;
  }

  public dispose() {
    const mapInstance = EndfieldMap.getInstance();
    mapInstance.map.removeLayer(this.layer);
    this.layer.dispose();
  }
}

export class SingleMapRender {
  private data: MapData;
  public tileSource: XYZ;

  constructor(data: MapData) {
    this.data = data;
    const asset = EndfieldMapAsset.getInstance();
    this.tileSource = new XYZ({
      projection: EndfieldMap.projection,
      url: `${asset.mapImage}/${this.data.id}/{z}/{y}/{x}.png`,
      tileLoadFunction: tileLoadFunction,
      cacheSize: 500,
      maxZoom: 5,
      minZoom: this.data?.zoom?.min || DEFAULT_MIN_ZOOM,
    });
  }

  get defaultCenterXYZ() {
    return this.data.center;
  }

  get defaultCenterCRD() {
    const mapDataInstance = MapDataManager.getInstance();
    return mapDataInstance.xyz2crd(this.data.center, this.data.id);
  }

  /** 渲染函数 */
  public render() {
    const olMapInstance = EndfieldMap.getInstance();
    const map = olMapInstance.map;
    map.getView().setCenter(this.defaultCenterCRD);
    map.getView().setZoom(this.data.zoom?.default || DEFAULT_ZOOM);
    map.getView().setMaxZoom(this.data.zoom?.max || DEFAULT_MAX_ZOOM);
    map.getView().setMinZoom(this.data.zoom?.min || DEFAULT_MIN_ZOOM);
  }

  /** 清理函数 */
  public dispose() {}
}
