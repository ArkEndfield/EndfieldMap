import type { MapIndex } from "@endfieldmap/map-core/const";
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { AreaNameDataManager } from "@endfieldmap/map-core/data/area_name";
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { AreaNameFeatureStyle, AreaNameLayerConfig} from "@endfieldmap/map-core/render/layers/area_name";
import { AreaNameLayer } from "@endfieldmap/map-core/render/layers/area_name";
import type { JSONLoader, Language } from "@endfieldmap/tools";

export interface AreaNameControllerConfig extends AreaNameLayerConfig {
  jsonLoader: JSONLoader;
  asset_path: string;
}

export class AreaNameController {
  public areaNameLayer: AreaNameLayer;
  public areaNameDataManager: AreaNameDataManager;
  constructor(config: AreaNameControllerConfig) {
    const { jsonLoader, asset_path, ...areaNameLayerConfig } = config;
    this.areaNameLayer = new AreaNameLayer(areaNameLayerConfig);
    this.areaNameDataManager = new AreaNameDataManager({
      jsonLoader,
      assetPath: asset_path,
    });
    mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, this.autoRefreshAreaName.bind(this));
  }

  private autoRefreshAreaName(zoom: number) {
    this.setAreaName(this.areaNameDataManager.mapIndex, this.areaNameDataManager.language, zoom);
  }

  public async setAreaName(mapIndex: MapIndex | null, language: Language | null, zoom?: number, forceUpdate: boolean = false) {
    if (!language || !mapIndex || !zoom) return;
    const currentData = this.areaNameDataManager.currentData;
    const areaNameData = await this.areaNameDataManager.getAreaNameData(mapIndex, language, zoom);
    if (currentData && areaNameData === currentData && !forceUpdate) return;
    if (!areaNameData) return;
    this.areaNameLayer.setAreaName(areaNameData, mapIndex);
  }

  /**
   * 刷新图层
   */
  public refresh() {
    this.setAreaName(this.areaNameDataManager.mapIndex, this.areaNameDataManager.language, this.areaNameDataManager.zoom, true);
  }

  /**
   * 改变文本描边颜色
   * @param color 文本描边颜色
   */
  public changeStrokeColor(color: string) {
    this.areaNameLayer.changeStrokeColor(color);
    this.refresh();
  }

  /**
   * 改变文本描边宽度
   * @param width 文本描边宽度
   */
  public changeTextStrokeWidth(width: number) {
    this.areaNameLayer.changeTextStrokeWidth(width);
    this.refresh();
  }

   /**
   * 改变文本字体
   * @param font 文本字体
   */
  public changeTextFont(font: string) {
    this.areaNameLayer.changeTextFont(font);
    this.refresh();
  }

  /**
   * 改变样式
   * @param style 样式
   */
  public changeStyle(style: AreaNameFeatureStyle) {
    this.areaNameLayer.changeStyle(style);
    this.refresh();
  }
}