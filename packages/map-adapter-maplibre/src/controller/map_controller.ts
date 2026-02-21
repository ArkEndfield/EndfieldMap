import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre/utils/coordinate';
import { MapLibreMapView } from '@endfieldmap/map-adapter-maplibre/view/map_view';
import type { IMapController, MapCoordinate, MapDataJson } from '@endfieldmap/map-core';
import { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM, DEFAULT_ZOOM, MapDataManager } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

export interface MapControllerConfig {
  data: MapDataJson;
}

/**
 * MapLibre 地图控制器
 * 管理地图数据和视图状态，不直接操作 MapLibre 实例
 */
export class MapController implements IMapController {
  public readonly dataManager: MapDataManager;
  public readonly view: MapLibreMapView;

  @observable accessor _tileUrlTemplate = '';

  @observable accessor _currentZoomConfig = {
    default: DEFAULT_ZOOM,
    min: DEFAULT_MIN_ZOOM,
    max: DEFAULT_MAX_ZOOM,
  };

  constructor(config: MapControllerConfig) {
    this.dataManager = new MapDataManager(config.data);
    this.view = new MapLibreMapView();
  }

  get tileUrlTemplate(): string {
    return this._tileUrlTemplate;
  }

  get zoomConfig(): Readonly<{ default: number; min: number; max: number }> {
    return this._currentZoomConfig;
  }

  setCenter(center: MapCoordinate): void {
    const lngLat = pixelToLngLat(center);
    this.view.currentCenter = center;
    this.view.currentCenterLngLat = lngLat;
  }

  getCenter(): MapCoordinate | undefined {
    return this.view.getCenter();
  }

  moveViewCenter(center: MapCoordinate, zoom?: number): void {
    this.view.animate({ center, zoom, duration: 500 });
  }

  setZoom(zoom: number): void {
    this.view.currentZoom = zoom;
  }

  /**
   * 切换并渲染指定地图
   * 更新数据管理器的当前地图和 zoom 配置；视图位置由调用方恢复（如 RN 端按地图缓存 center/zoom）
   */
  @action
  renderMap(id: string): void {
    this.dataManager.setCurrentMap(id);

    const mapData = this.dataManager.getMapData(id);
    if (!mapData) return;

    this._currentZoomConfig = {
      default: mapData.zoom?.default ?? DEFAULT_ZOOM,
      min: mapData.zoom?.min ?? DEFAULT_MIN_ZOOM,
      max: mapData.zoom?.max ?? DEFAULT_MAX_ZOOM,
    };
    // 不在此处重置 view：Web 由 MapStateDataService 按 mapId 恢复；RN 由 GameMapView 按 savedViewStateByMapId 恢复
  }

  @action
  updateTileUrl(mapImageBase: string): void {
    const mapId = this.dataManager.currentMapId;
    if (!mapImageBase || !mapId) {
      logger.warn('[MapController] Invalid mapImageBase or mapId:', { mapImageBase, mapId });
      this._tileUrlTemplate = '';
      return;
    }
    // 确保 URL 格式正确：移除末尾的斜杠，添加 mapId 和模板
    const base = mapImageBase.endsWith('/') ? mapImageBase.slice(0, -1) : mapImageBase;
    this._tileUrlTemplate = `${base}/${mapId}/{z}/{y}/{x}.png`;
  }

  dispose(): void {
    // 无需清理
  }
}
