import type { MapIndex } from '@endfieldmap/map-core/const/map';
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_ACTIVE_COLOR_TRANSPARENT_50,
  DEFAULT_ACTIVE_COLOR_TRANSPARENT_75,
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
  /** 图标样式缓存 */
  private iconStyleCache: Style | null = null;
  /** hover 时的图标样式缓存（稍大一点，突出 hover 效果） */
  private hoverIconStyleCache: Style | null = null;

  /** 通用样式-backdrop */
  private static readonly BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];

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

  /** 激活样式（蓝色描边） */
  private static readonly ACTIVE_STYLE_BG = {
    ...createEntityBackgroundStyles(
      ENTITY_RADIUS,
      DEFAULT_STROKE_WIDTH,
      {
        '100': DEFAULT_FILL_COLOR,
        '50': DEFAULT_FILL_COLOR_TRANSPARENT_50,
        '75': DEFAULT_FILL_COLOR_TRANSPARENT_75,
      },
      {
        '100': DEFAULT_ACTIVE_COLOR,
        '50': DEFAULT_ACTIVE_COLOR_TRANSPARENT_50,
        '75': DEFAULT_ACTIVE_COLOR_TRANSPARENT_75,
      },
    ),
  } as const;

  constructor(config: CommonPointEntityLayerConfig) {
    super();
    this.config = config;
    this.infoData = config.infoData;
    this.entity = new ClusterEntitySource({
      data: config.data,
      mapIndex: config.mapIndex,
      clusterOptions: config.clusterOptions,
    });
    this.layer = new VectorLayer({
      source: this.entity.clusterSource,
      style: this.createStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 250,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: this.visible,
    });
    this.layer.set(LayerTypeKey, LayerType.ENTITY);
    const iconSize = this.config.icon.size ?? DEFAULT_ICON_SIZE;
    // 预创建图标样式（普通 + hover）
    const { iconStyle, hoverIconStyle } = createEntityIconStyles({
      url: this.config.icon.url,
      size: iconSize,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
      hoverScale: 1.15,
    });
    this.iconStyleCache = iconStyle;
    this.hoverIconStyleCache = hoverIconStyle;
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
    hoverState: 'none' | 'some',
  ): string {
    return `${fillOpacity}-${strokeOpacity}-${state}-${size}-${hoverState}`;
  }

  private createStyle(feature: FeatureLike) {
    const features = feature.get('features');
    const size: number = features.length;

    // 获取所有MapFeature实例
    const mapFeatures: MapFeature[] = features.map((f: Feature) => f.get(EntityInstanceKey));

    // 统计marked、selected、active 和 hovered 的数量
    const markedCount = mapFeatures.filter((mf) => mf.marked).length;
    const selectedCount = mapFeatures.filter((mf) => mf.isSelected).length;
    const activeCount = mapFeatures.filter((mf) => mf.active).length;
    const hoveredCount = mapFeatures.filter((mf) => mf.hovered).length;

    const hasMarked = markedCount > 0;
    const hasSelected = selectedCount > 0;
    const hasActive = activeCount > 0;
    const hasHovered = hoveredCount > 0;

    // 判断是否所有feature都marked
    const allMarked = markedCount === size;
    // 判断是否所有feature都selected
    const allSelected = selectedCount === size;
    // 判断是否所有feature都active
    const allActive = activeCount === size;

    // 计算透明度（基于marked状态）
    let fillOpacity: '50' | '75' | '100' = '100';
    if (hasMarked) {
      // 如果所有feature都marked，透明度为50%
      if (allMarked) {
        fillOpacity = '50';
      } else {
        // 有多个feature但不是全部marked，透明度为75%
        fillOpacity = '75';
      }
    }

    // 计算描边透明度和状态（active优先级最高）
    let strokeOpacity: '50' | '75' | '100' = '100';
    let state: 'active' | 'selected' | 'normal' = 'normal';
    
    if (hasActive) {
      state = 'active';
      if (allActive) {
        strokeOpacity = '50';
      } else {
        strokeOpacity = '75';
      }
    } else if (hasSelected) {
      state = 'selected';
      if (allSelected) {
        strokeOpacity = '50';
      } else {
        strokeOpacity = '75';
      }
    } else {
      strokeOpacity = fillOpacity;
    }

    // 生成缓存键并尝试从缓存获取样式（聚合点中只要存在 hovered 就视为 hover）
    const hoverState: 'none' | 'some' = hasHovered ? 'some' : 'none';
    const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state, size, hoverState);
    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    // 创建样式数组
    const styles: Style[] = [...CommonPointEntityLayer.BASE_BACKDROP_STYLE];

    // 根据状态添加对应样式（包含背景、装饰线和三角指示器）
    if (state === 'active') {
      styles.push(...CommonPointEntityLayer.ACTIVE_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]);
    } else if (state === 'selected') {
      styles.push(...CommonPointEntityLayer.SELECTED_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]);
    } else {
      styles.push(...CommonPointEntityLayer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`]);
    }

    // 添加图标样式：在 hover 状态下放大图标（包括聚合点）
    if (hasHovered) {
      styles.push(this.hoverIconStyleCache!);
    } else {
      styles.push(this.iconStyleCache!);
    }

    // 添加 size 样式（聚合数量）
    if (size > 1) {
      styles.push(
        createClusterStyle({
          radius: ENTITY_RADIUS,
          size: size,
        }),
      );
    }

    // 缓存样式
    this.styleCache.set(cacheKey, styles);

    return styles;
  }

  @computed get entityDataIdKey() {
    return this.infoData.entityInfo.point;
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
      activeCount: this.entity.features.getArray().filter((feature) => feature.active).length,
    }
  }
}
