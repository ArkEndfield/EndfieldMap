import type { MapIndex } from '@endfieldmap/map-core/const/map';
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_FILL_COLOR_TRANSPARENT_50,
  DEFAULT_FILL_COLOR_TRANSPARENT_75,
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_COLOR_TRANSPARENT_50,
  DEFAULT_STROKE_COLOR_TRANSPARENT_75,
  DEFAULT_STROKE_WIDTH,
  ElectricPoleIdKey,
  EntityInstanceKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import {
  createBlurredShadowStyles,
  createEntityBackgroundStyles,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import type { ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type { ElectricPoleData, ElectricPoleDataList, EntityInfoItemData } from '@endfieldmap/map-core/types';
import { action, computed, observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import type Style from 'ol/style/Style';
import { ElectricPoleSource } from '@endfieldmap/map-core/render/source/electric_pole';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface ElectricPoleEntityLayerConfig {
  data: ElectricPoleDataList;
  icon: {
    url: string;
    size?: number;
  };
  mapIndex: MapIndex;
  clusterOptions?: ClusterOptions;
  renderBuffer?: number;
}

export class ElectricPoleEntityLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer;
  /** entity 实例 */
  @observable accessor entity: ElectricPoleSource;
  /** 配置 */
  @observable accessor config: ElectricPoleEntityLayerConfig;
  /** 是否可见 */
  @observable accessor visible: boolean = true;

  /** 样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();
  /** 图标样式缓存 */
  private iconStyleCache: Style | null = null;
  /** 是否启用阴影（性能优化选项） */
  private enableShadow: boolean = false;

  /** 通用样式-backdrop */
  private static BASE_BACKDROP_STYLE: Style[] = [];

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
      }
    ),
  } as const;

  constructor(config: ElectricPoleEntityLayerConfig) {
    super();
    this.config = config;
    this.entity = new ElectricPoleSource({
      data: config.data,
      mapIndex: config.mapIndex,
    });
    this.layer = new VectorLayer({
      source: this.entity.source,
      style: this.createStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: this.visible,
      zIndex: 6, // 电线杆图层
      declutter: false,
    });
    this.layer.set(LayerTypeKey, LayerType.ELECTRIC_POLE);
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
      ElectricPoleEntityLayer.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
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
   */
  private generateStyleCacheKey(
    fillOpacity: '50' | '75' | '100',
    strokeOpacity: '50' | '75' | '100',
    state: 'active' | 'selected' | 'normal'
  ): string {
    return `${fillOpacity}-${strokeOpacity}-${state}`;
  }

  private createStyle(feature: FeatureLike) {
    const mapFeature = feature.get(EntityInstanceKey);
    if (!mapFeature) {
      return [];
    }
    // 获取所有MapFeature实例
    // 计算透明度（基于marked状态）
    let fillOpacity: '50' | '75' | '100' = '100';
    if (mapFeature.marked) {
      fillOpacity = '50';
    } else if (mapFeature.isSelected) {
      fillOpacity = '75';
    }

    // 计算描边透明度和状态
    const strokeOpacity: '50' | '75' | '100' = fillOpacity;
    const state = 'normal' as const;

    // 生成缓存键并尝试从缓存获取样式
    const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state);
    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    // 创建样式数组（优化：减少数组操作）
    const bgStyles = ElectricPoleEntityLayer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];

    const styles: Style[] = this.enableShadow
      ? [...ElectricPoleEntityLayer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!]
      : [...bgStyles, this.iconStyleCache!];

    // 缓存样式
    this.styleCache.set(cacheKey, styles);

    return styles;
  }

  @computed
  get entityDataIdKey() {
    return ElectricPoleIdKey;
  }

  @computed
  get entityInfo(): EntityInfoItemData<ElectricPoleData> {
    return {
      uniqueKey: `${this.config.mapIndex}-${ElectricPoleIdKey}`,
      category: 'electric_pole',
      entityDataIdKey: this.entityDataIdKey,
      entityInfo: {
        point: ElectricPoleIdKey,
        pic: this.config.icon.url,
      },
      visible: this.visible,
      data: this.config.data,
      mapIndex: this.config.mapIndex,
      count: this.config.data.length,
      markedCount: this.entity.features.getArray().filter((feature) => feature.marked).length,
      selectedCount: this.entity.features.getArray().filter((feature) => feature.isSelected).length,
    };
  }
}
