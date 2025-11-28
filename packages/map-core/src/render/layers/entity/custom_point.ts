import type { MapIndex } from '@endfieldmap/map-core/const/map';
import {
  DEFAULT_ICON_SIZE,
  CustomPointKey,
  LayerType,
  LayerTypeKey,
  DEFAULT_STROKE_WIDTH,
} from '@endfieldmap/map-core/const/map';
import { createEntityIconStyles, createEntityBackgroundStyles } from '@endfieldmap/map-core/render/factory';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type { CustomPointDataList } from '@endfieldmap/map-core/types';
import { action, computed, observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import type Style from 'ol/style/Style';
import { CustomPointSource } from '@endfieldmap/map-core/render/source/custom_point';
import type { EntityInfoItemData } from '@endfieldmap/map-core/types/entity';

export interface CustomPointEntityLayerConfig {
  data: CustomPointDataList;
  icon: {
    url: string;
    size?: number;
  };
  mapIndex: MapIndex;
}

export class CustomPointEntityLayer extends SingleLayerBase {
  public layer: VectorLayer;
  @observable accessor entity: CustomPointSource;
  @observable accessor config: CustomPointEntityLayerConfig;
  @observable accessor visible: boolean = true;

  private iconStyleCache: Style | null = null;
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
    this.layer.set('category', CustomPointKey);

    // 预创建图标样式
    const iconSize = this.config.icon.size || DEFAULT_ICON_SIZE;
    this.iconStyleCache = createEntityIconStyles({
      url: this.config.icon.url,
      size: iconSize,
      radius: CustomPointEntityLayer.ENTITY_RADIUS,
      borderWidth: DEFAULT_STROKE_WIDTH,
    });
  }

  private getStyle(feature: FeatureLike): Style[] {
    const instance = feature.get('entityInstance');

    if (!instance) {
      // 默认样式：背景 + 图标
      const bgStyles = CustomPointEntityLayer.BACKGROUND_STYLES['100-100'];
      return [...bgStyles, this.iconStyleCache!];
    }

    // 根据实例状态生成缓存键
    const marked = instance.marked || false;
    const selected = instance.isSelected || false;

    // 计算透明度
    const fillOpacity: '50' | '75' | '100' = marked ? '50' : '100';
    const strokeOpacity: '50' | '75' | '100' = selected ? '50' : fillOpacity;

    const cacheKey = `${fillOpacity}-${strokeOpacity}`;

    // 尝试从缓存获取
    if (!this.styleCache.has(cacheKey)) {
      const bgStyles = CustomPointEntityLayer.BACKGROUND_STYLES[cacheKey];
      const styles = [...bgStyles, this.iconStyleCache!];
      this.styleCache.set(cacheKey, styles);
    }

    return this.styleCache.get(cacheKey)!;
  }

  @computed
  public get entityDataIdKey(): string {
    return CustomPointKey;
  }

  @computed
  public get entityInfo(): EntityInfoItemData {
    return {
      uniqueKey: `${this.config.mapIndex}-${CustomPointKey}-${CustomPointKey}`,
      category: CustomPointKey,
      entityDataIdKey: CustomPointKey,
      entityInfo: {
        point: CustomPointKey,
        pic: '', // 自定义标点没有固定的pic
      },
      visible: this.visible,
      data: this.config.data,
      mapIndex: this.config.mapIndex,
      count: this.config.data.length,
      markedCount: this.entity.features.getArray().filter((feature) => feature.marked).length,
      selectedCount: this.entity.features.getArray().filter((feature) => feature.isSelected).length,
    };
  }

  @action
  public setVisible(visible: boolean) {
    this.visible = visible;
    this.layer.setVisible(visible);
  }
}
