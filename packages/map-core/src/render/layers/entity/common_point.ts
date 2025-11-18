import type { MapIndex } from '@endfieldmap/map-core/const/map';
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_FILL_COLOR_TRANSPARENT_50,
  DEFAULT_FILL_COLOR_TRANSPARENT_75,
  DEFAULT_ICON_SIZE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_SELECTED_COLOR_TRANSPARENT_50,
  DEFAULT_SELECTED_COLOR_TRANSPARENT_75,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_COLOR_TRANSPARENT_50,
  DEFAULT_STROKE_COLOR_TRANSPARENT_75,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import {
  createBlurredShadowStyles,
  createClusterStyle,
  createEntityBackgroundStyles,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import type { ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import { ClusterEntitySource } from '@endfieldmap/map-core/render/source/entity';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type { EntityDataList, EntityInfoData, EntityInfoItemData } from '@endfieldmap/map-core/types';
import { action, computed, observable } from 'mobx';
import type { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import type Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface CommonPointEntityLayerConfig {
  name: string;
  infoData: EntityInfoData;
  icon: {
    url: string;
    size?: number;
  };
  data: EntityDataList;
  mapIndex: MapIndex;
  clusterOptions?: ClusterOptions;
  renderBuffer?: number;
  /** 性能配置 */
  performance?: {
    enableShadow?: boolean;
    maxStyleCacheSize?: number;
  };
}

export class CommonPointEntityLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer;
  /** entity 实例 */
  @observable accessor entity: ClusterEntitySource;
  /** 配置 */
  @observable accessor config: CommonPointEntityLayerConfig;
  /** 实体信息数据 */
  @observable accessor infoData: EntityInfoData;
  /** 是否可见 */
  @observable accessor visible: boolean = false;

  /** 样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();
  /** 样式缓存键的 LRU 队列 */
  private styleCacheKeys: string[] = [];
  /** 图标样式缓存 */
  private iconStyleCache: Style | null = null;
  /** 是否启用阴影（性能优化选项） */
  private enableShadow: boolean = false;
  /** 样式缓存最大数量 */
  private maxStyleCacheSize: number = 1000;

  /** 通用样式-backdrop */
  private static BASE_BACKDROP_STYLE: Style[] = [];

  /** 选中样式（包含背景、装饰线和三角指示器） */
  private static readonly SELECTED_STYLE_BG = {
    ...createEntityBackgroundStyles(
      ENTITY_RADIUS,
      DEFAULT_STROKE_WIDTH,
      {
        '100': DEFAULT_FILL_COLOR,
        '50': DEFAULT_FILL_COLOR_TRANSPARENT_50,
        '75': DEFAULT_FILL_COLOR_TRANSPARENT_75,
      },
      {
        '100': DEFAULT_SELECTED_COLOR,
        '50': DEFAULT_SELECTED_COLOR_TRANSPARENT_50,
        '75': DEFAULT_SELECTED_COLOR_TRANSPARENT_75,
      },
    ),
  } as const;

  /** 非选中样式（包含背景、装饰线和三角指示器） */
  private static readonly NORMAL_STYLE_BG = {
    ...createEntityBackgroundStyles(
      ENTITY_RADIUS,
      DEFAULT_STROKE_WIDTH,
      {
        '100': DEFAULT_FILL_COLOR,
        '50': DEFAULT_FILL_COLOR_TRANSPARENT_50,
        '75': DEFAULT_FILL_COLOR_TRANSPARENT_75,
      },
      {
        '100': DEFAULT_STROKE_COLOR,
        '50': DEFAULT_STROKE_COLOR_TRANSPARENT_50,
        '75': DEFAULT_STROKE_COLOR_TRANSPARENT_75,
      },
    ),
  } as const;

  constructor(config: CommonPointEntityLayerConfig) {
    super();
    this.config = config;
    this.infoData = config.infoData;
    
    // 应用性能配置
    this.enableShadow = config.performance?.enableShadow ?? false;
    this.maxStyleCacheSize = config.performance?.maxStyleCacheSize ?? 1000;
    
    this.entity = new ClusterEntitySource({
      data: config.data,
      mapIndex: config.mapIndex,
      clusterOptions: config.clusterOptions,
    });
    this.layer = new VectorLayer({
      source: this.entity.clusterSource,
      style: this.createStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: this.visible,
      zIndex: 5, // 普通实体图层
      declutter: false,
    });
    this.layer.set(LayerTypeKey, LayerType.ENTITY);
    const iconSize = this.config.icon.size ?? DEFAULT_ICON_SIZE;
    // 预创建图标样式
    const iconStyle = createEntityIconStyles({
      url: this.config.icon.url,
      size: iconSize,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
    });
    this.iconStyleCache = iconStyle;
    
    // 初始化阴影样式（如果启用）
    if (this.enableShadow) {
      CommonPointEntityLayer.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
    }
  }

  /**
   * 设置图层可见性
   * @param visible 是否可见
   */
  @action
  public setVisible(visible: boolean) {
    this.visible = visible;
    this.layer.setVisible(visible);
  }

  /**
   * 生成样式缓存的键
   * @param fillOpacity 填充透明度
   * @param strokeOpacity 描边透明度
   * @param state 状态：'active' | 'selected' | 'normal'
   * @param size 聚合数量
   */
  private generateStyleCacheKey(
    fillOpacity: '50' | '75' | '100',
    strokeOpacity: '50' | '75' | '100',
    state: 'active' | 'selected' | 'normal',
    size: number,
  ): string {
    return `${fillOpacity}-${strokeOpacity}-${state}-${size}`;
  }

  private createStyle(feature: FeatureLike) {
    const features = feature.get('features');
    const size: number = features.length;

    // 快速路径：单个feature且无状态变化
    if (size === 1) {
      const mapFeature: MapFeature = features[0].get(EntityInstanceKey);
      const marked = mapFeature.marked;
      const selected = mapFeature.isSelected;
      
      // 计算透明度
      const fillOpacity: '50' | '75' | '100' = marked ? '50' : '100';
      const strokeOpacity: '50' | '75' | '100' = selected ? '50' : fillOpacity;
      const state: 'selected' | 'normal' = selected ? 'selected' : 'normal';
      
      const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state, 1);
      const cachedStyle = this.styleCache.get(cacheKey);
      if (cachedStyle) {
        return cachedStyle;
      }

      // 创建样式（优化：减少数组操作）
      const bgStyles = state === 'selected' 
        ? CommonPointEntityLayer.SELECTED_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]
        : CommonPointEntityLayer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];
      
      const styles: Style[] = this.enableShadow
        ? [...CommonPointEntityLayer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!]
        : [...bgStyles, this.iconStyleCache!];
      
      this.addToStyleCache(cacheKey, styles);
      return styles;
    }

    // 聚合feature的处理
    const mapFeatures: MapFeature[] = features.map((f: Feature) => f.get(EntityInstanceKey));

    // 统计marked、selected的数量
    let markedCount = 0;
    let selectedCount = 0;
    for (let i = 0; i < size; i++) {
      if (mapFeatures[i].marked) markedCount++;
      if (mapFeatures[i].isSelected) selectedCount++;
    }

    const hasMarked = markedCount > 0;
    const hasSelected = selectedCount > 0;
    const allMarked = markedCount === size;
    const allSelected = selectedCount === size;

    // 计算透明度（基于marked状态）
    let fillOpacity: '50' | '75' | '100' = '100';
    if (hasMarked) {
      fillOpacity = allMarked ? '50' : '75';
    }

    // 计算描边透明度和状态
    let strokeOpacity: '50' | '75' | '100' = '100';
    let state: 'selected' | 'normal' = 'normal';
    
    if (hasSelected) {
      state = 'selected';
      strokeOpacity = allSelected ? '50' : '75';
    } else {
      strokeOpacity = fillOpacity;
    }

    // 生成缓存键并尝试从缓存获取样式
    const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state, size);
    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    // 创建样式数组（优化：减少数组操作）
    const bgStyles = state === 'selected'
      ? CommonPointEntityLayer.SELECTED_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]
      : CommonPointEntityLayer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];
    
    const clusterStyle = createClusterStyle({
      radius: ENTITY_RADIUS,
      size: size,
    });

    const styles: Style[] = this.enableShadow
      ? [...CommonPointEntityLayer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!, clusterStyle]
      : [...bgStyles, this.iconStyleCache!, clusterStyle];

    // 缓存样式
    this.addToStyleCache(cacheKey, styles);

    return styles;
  }

  @computed get entityDataIdKey() {
    return this.infoData.entityInfo.point;
  }

  /**
   * 添加样式到缓存，使用 LRU 策略管理缓存大小
   */
  private addToStyleCache(key: string, styles: Style[]): void {
    // 如果已存在，先移除旧的键
    const existingIndex = this.styleCacheKeys.indexOf(key);
    if (existingIndex !== -1) {
      this.styleCacheKeys.splice(existingIndex, 1);
    }

    // 添加到队列末尾
    this.styleCacheKeys.push(key);
    this.styleCache.set(key, styles);

    // 如果超过最大缓存数量，移除最旧的
    if (this.styleCacheKeys.length > this.maxStyleCacheSize) {
      const oldestKey = this.styleCacheKeys.shift();
      if (oldestKey) {
        this.styleCache.delete(oldestKey);
      }
    }
  }

  @computed get entityInfo(): EntityInfoItemData {
    return {
      uniqueKey: `${this.config.mapIndex}-${this.infoData.category}-${this.entityDataIdKey}`,
      category: this.infoData.category,
      entityDataIdKey: this.entityDataIdKey,
      entityInfo: this.infoData.entityInfo,
      visible: this.visible,
      data: this.config.data,
      mapIndex: this.config.mapIndex,
      count: this.config.data.length,
      markedCount: this.entity.features.getArray().filter((feature) => feature.marked).length,
      selectedCount: this.entity.features.getArray().filter((feature) => feature.isSelected).length,
    }
  }
}
