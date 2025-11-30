import type { MapIndex } from '@endfieldmap/map-core/const/map';
import {
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import { createEntityBackgroundStyles,createEntityIconStyles } from '@endfieldmap/map-core/render/factory';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { CustomPointSource } from '@endfieldmap/map-core/render/source/custom_point';
import type { CustomPointDataList } from '@endfieldmap/map-core/types';
import { action, observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import type Style from 'ol/style/Style';

import { CustomPointFeature } from '../../source/feature/custom_point_feature';
export interface CustomPointEntityLayerConfig {
  data: CustomPointDataList;
  icon: {
    imagePath: string;
    size?: number;
  };
  mapIndex: MapIndex;
}

export class CustomPointEntityLayer extends SingleLayerBase {
  public layer: VectorLayer;
  @observable accessor entity: CustomPointSource;
  @observable accessor config: CustomPointEntityLayerConfig;
  @observable accessor visible: boolean = true;

  private iconStyleCache: Map<string, Style> = new Map();
  private styleCache: Map<string, Style[]> = new Map();

  // 自定义标点使用更深的颜色
  private static readonly CUSTOM_POINT_FILL_COLOR = '#3A3A3A';
  private static readonly CUSTOM_POINT_FILL_COLOR_50 = 'rgba(58, 58, 58, 0.5)';
  private static readonly CUSTOM_POINT_FILL_COLOR_75 = 'rgba(58, 58, 58, 0.75)';
  private static readonly CUSTOM_POINT_STROKE_COLOR = '#1A1A1A';
  private static readonly CUSTOM_POINT_STROKE_COLOR_50 = 'rgba(26, 26, 26, 0.5)';
  private static readonly CUSTOM_POINT_STROKE_COLOR_75 = 'rgba(26, 26, 26, 0.75)';

  private static readonly ENTITY_RADIUS = DEFAULT_ICON_SIZE / 2;

  // 背景样式（圆形 + 装饰 + 三角指示器）
  private static readonly BACKGROUND_STYLES = {
    ...createEntityBackgroundStyles(
      CustomPointEntityLayer.ENTITY_RADIUS,
      DEFAULT_STROKE_WIDTH,
      {
        '100': CustomPointEntityLayer.CUSTOM_POINT_FILL_COLOR,
        '50': CustomPointEntityLayer.CUSTOM_POINT_FILL_COLOR_50,
        '75': CustomPointEntityLayer.CUSTOM_POINT_FILL_COLOR_75,
      },
      {
        '100': CustomPointEntityLayer.CUSTOM_POINT_STROKE_COLOR,
        '50': CustomPointEntityLayer.CUSTOM_POINT_STROKE_COLOR_50,
        '75': CustomPointEntityLayer.CUSTOM_POINT_STROKE_COLOR_75,
      }
    ),
  } as const;

  constructor(config: CustomPointEntityLayerConfig) {
    super();
    this.config = config;
    this.entity = new CustomPointSource({
      data: config.data,
      mapIndex: config.mapIndex,
    });

    this.layer = new VectorLayer({
      source: this.entity.source,
      style: (feature) => this.getStyle(feature),
      zIndex: 6,
      renderBuffer: 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
    });

    this.layer.set(LayerTypeKey, LayerType.CUSTOM_POINT);
  }

  /**
   * 获取或创建图标样式
   * @param pic 图标文件名（不含扩展名）
   */
  private getOrCreateIconStyle(pic: string): Style {
    if (!this.iconStyleCache.has(pic)) {
      const iconSize = this.config.icon.size || DEFAULT_ICON_SIZE;
      const iconStyle = createEntityIconStyles({
        url: `${this.config.icon.imagePath}/${pic}.png`,
        size: iconSize,
        radius: CustomPointEntityLayer.ENTITY_RADIUS,
        borderWidth: DEFAULT_STROKE_WIDTH,
      });
      this.iconStyleCache.set(pic, iconStyle);
    }
    return this.iconStyleCache.get(pic)!;
  }

  private getStyle(feature: FeatureLike): Style[] {
    const instance = feature.get(EntityInstanceKey) as CustomPointFeature;

    // 如果 feature 不可见，返回空数组不渲染
    if (instance && !instance.visible) {
      return [];
    }

    // 获取图标文件名（从 entityInfo.pic）
    const pic = instance.data.entityInfo.entityInfo.pic;

    if (!instance) {
      // 默认样式：背景 + 图标
      const bgStyles = CustomPointEntityLayer.BACKGROUND_STYLES['100-100'];
      const iconStyle = this.getOrCreateIconStyle(pic);
      return [...bgStyles, iconStyle];
    }

    // 根据实例状态生成缓存键（包含图标类型）
    const marked = instance.marked || false;
    const selected = instance.isSelected || false;

    // 计算透明度
    const fillOpacity: '50' | '75' | '100' = marked ? '50' : '100';
    const strokeOpacity: '50' | '75' | '100' = selected ? '50' : fillOpacity;

    const cacheKey = `${pic}-${fillOpacity}-${strokeOpacity}`;

    // 尝试从缓存获取
    if (!this.styleCache.has(cacheKey)) {
      const bgStyles = CustomPointEntityLayer.BACKGROUND_STYLES[cacheKey.split('-').slice(1).join('-')];
      const iconStyle = this.getOrCreateIconStyle(pic);
      const styles = [...bgStyles, iconStyle];
      this.styleCache.set(cacheKey, styles);
    }

    return this.styleCache.get(cacheKey)!;
  }

  @action
  public setVisible(visible: boolean) {
    this.visible = visible;
    this.layer.setVisible(visible);
  }
}
