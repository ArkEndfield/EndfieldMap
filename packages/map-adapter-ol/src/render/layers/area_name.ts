import { SingleLayerBase } from '@endfieldmap/map-adapter-ol/render/layers/_base';
import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';
import type { MapBaseRegionData, MapData, MapDataManager, OverrideRegionData } from '@endfieldmap/map-core';
import { FeatureType, FeatureTypeKey, LayerType, LayerTypeKey } from '@endfieldmap/map-core';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

const FEATURE_NAME_KEY = 'areaName';

/** 区域名称样式 */
export interface AreaNameFeatureStyle {
  /** 文本颜色 */
  textColor?: string;
  /** 文本描边颜色 */
  textStrokeColor?: string;
  /** 文本描边宽度 */
  textStrokeWidth?: number;
  /** 文本字体 */
  textFont?: string;
}

/** 区域名称图层配置 */
export interface AreaNameLayerConfig {
  /** 渲染缓冲区 */
  renderBuffer?: number;
  /** 动画时更新 */
  updateWhileAnimating?: boolean;
  /** 交互时更新 */
  updateWhileInteracting?: boolean;
  /** 样式 */
  style?: AreaNameFeatureStyle;
  /** 获取名称 */
  getName?: (name: string) => string;
}

export class AreaNameLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer;
  /** 向量源 */
  public vectorSource: VectorSource;
  /** 配置 */
  public config: AreaNameLayerConfig;
  /** features */
  public nameFeatures: Feature[] = [];
  /** 地图数据管理器 */
  public readonly mapDataManager: MapDataManager;

  constructor(mapDataManager: MapDataManager, config?: AreaNameLayerConfig) {
    super();
    this.mapDataManager = mapDataManager;
    this.vectorSource = new VectorSource();
    this.config = config ?? {};
    this.layer = new VectorLayer({
      source: this.vectorSource,
      zIndex: Z_INDEX.AREA_NAME,
      renderBuffer: this.config.renderBuffer ?? 100,
      updateWhileAnimating: this.config.updateWhileAnimating ?? false,
      updateWhileInteracting: this.config.updateWhileInteracting ?? false,
      declutter: false,
    });
    this.layer.set(LayerTypeKey, LayerType.AREA_NAME);
  }

  /**
   * 创建区域名称样式
   * @param name 区域名称
   * @returns 区域名称样式
   */
  private createAreaNameStyle(name: string) {
    const text = this.config.getName?.(name) ?? name;
    return new Style({
      text: new Text({
        text,
        font: this.config.style?.textFont ?? 'bold 1.5rem "Noto Sans SC", sans-serif',
        fill: new Fill({ color: this.config.style?.textColor ?? '#fff' }),
        stroke: new Stroke({
          color: this.config.style?.textStrokeColor ?? '#000',
          width: this.config.style?.textStrokeWidth ?? 2,
        }),
        padding: [5, 10, 5, 10],
        offsetY: -15,
      }),
    });
  }

  /**
   * 设置区域名称
   * @param data 区域数据
   * @param mapId 地图索引
   */
  public async setAreaName(data: (MapBaseRegionData | OverrideRegionData)[], mapId: MapData['id']) {
    this.vectorSource.clear();
    this.nameFeatures = [];
    for (const region of data) {
      if (!region.name || !region.position) continue;
      const areaNameFeature = new Feature({
        geometry: new Point(this.mapDataManager.xyz2crd(region.position, mapId)),
      });
      areaNameFeature.setStyle(this.createAreaNameStyle(region.name));
      areaNameFeature.set(FeatureTypeKey, FeatureType.AREA_NAME);
      areaNameFeature.set(FEATURE_NAME_KEY, region.name);
      this.nameFeatures.push(areaNameFeature);
      this.vectorSource.addFeature(areaNameFeature);
    }
  }

  /**
   * 改变文本颜色
   * @param color 文本颜色
   */
  public changeTextColor(color: string) {
    if (!this.config.style) {
      this.config.style = { textColor: color };
    } else {
      this.config.style = { ...this.config.style, textColor: color };
    }
    for (const feature of this.nameFeatures) {
      feature.setStyle(this.createAreaNameStyle(feature.get(FEATURE_NAME_KEY)));
    }
  }

  /**
   * 改变文本描边颜色
   * @param color 文本描边颜色
   */
  public changeStrokeColor(color: string) {
    if (!this.config?.style) {
      this.config.style = { textStrokeColor: color };
    } else {
      this.config.style = { ...this.config.style, textStrokeColor: color };
    }
  }

  /**
   * 改变文本描边宽度
   * @param width 文本描边宽度
   */
  public changeTextStrokeWidth(width: number) {
    if (!this.config?.style) {
      this.config.style = { textStrokeWidth: width };
    } else {
      this.config.style = { ...this.config.style, textStrokeWidth: width };
    }
  }

  /**
   * 改变文本字体
   * @param font 文本字体
   */
  public changeTextFont(font: string) {
    if (!this.config?.style) {
      this.config.style = { textFont: font };
    } else {
      this.config.style = { ...this.config.style, textFont: font };
    }
  }

  /**
   * 改变样式
   * @param style 样式
   */
  public changeStyle(style: AreaNameFeatureStyle) {
    if (!this.config?.style) {
      this.config.style = style;
    } else {
      this.config.style = { ...this.config.style, ...style };
    }
  }

  /**
   * 移除图层
   */
  public remove() {
    this.vectorSource.clear();
    this.nameFeatures = [];
    this.layer.setSource(null);
  }
}
