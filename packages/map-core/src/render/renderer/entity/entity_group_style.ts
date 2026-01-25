import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import {
  createBaseEntityBackgroundStyle,
  createBlurredShadowStyles,
  createClusterStyle,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface EntityGroupStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
  maxStyleCacheSize?: number;
  markedFilterMode?: MarkedFeatureFilterMode;
}

export class EntityGroupStyleProvider {
  /** 样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();

  /** 样式缓存键的LRU队列 */
  private styleCacheKeys: string[] = [];

  /** 图标样式缓存 */
  private iconStyleCache: Style | null = null;

  /** 是否启用阴影 */
  private enableShadow: boolean;

  /** 样式缓存最大数量 */
  private maxStyleCacheSize: number;

  /** 当前marked过滤模式 */
  private markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  /** 背景样式 - 选中状态 */
  private static readonly SELECTED_STYLE_BG = createBaseEntityBackgroundStyle(
    ENTITY_RADIUS,
    DEFAULT_STROKE_WIDTH,
    DEFAULT_FILL_COLOR,
    DEFAULT_SELECTED_COLOR
  );

  /** 背景样式 - 普通状态 */
  private static readonly NORMAL_STYLE_BG = createBaseEntityBackgroundStyle(
    ENTITY_RADIUS,
    DEFAULT_STROKE_WIDTH,
    DEFAULT_FILL_COLOR,
    DEFAULT_STROKE_COLOR
  );

  /** 阴影样式 */
  private static BASE_BACKDROP_STYLE: Style[] = [];

  constructor(config: EntityGroupStyleConfig) {
    this.enableShadow = config.enableShadow ?? false;
    this.maxStyleCacheSize = config.maxStyleCacheSize ?? 1000;

    if (config.markedFilterMode) {
      this.markedFilterMode = config.markedFilterMode;
    }

    // 初始化图标样式
    this.iconStyleCache = createEntityIconStyles({
      url: config.iconPath,
      size: DEFAULT_ICON_SIZE,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
    });

    // 初始化阴影样式
    if (this.enableShadow && EntityGroupStyleProvider.BASE_BACKDROP_STYLE.length === 0) {
      EntityGroupStyleProvider.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
    }
  }

  public setMarkedFilterMode(mode: MarkedFeatureFilterMode) {
    this.markedFilterMode = mode;
  }

  /**
   * 生成样式缓存键
   */
  private generateStyleCacheKey(opacity: number, state: 'active' | 'selected' | 'normal', size: number): string {
    // 保留2位小数以避免浮点数精度问题导致的缓存未命中
    return `${opacity.toFixed(2)}-${state}-${size}`;
  }

  /**
   * 应用透明度到样式列表
   * @param styles 原始样式列表
   * @param opacity 透明度 (0-1)
   */
  private applyOpacity(styles: Style[], opacity: number): Style[] {
    if (opacity >= 1) {
      return styles;
    }
    return styles.map((style) => {
      const clone = style.clone();
      const image = clone.getImage();
      if (image) {
        // 对于ImageStyle (Icon, Circle, RegularShape)，直接设置opacity
        image.setOpacity(opacity);
      }
      return clone;
    });
  }

  /**
   * 检查feature是否因marked状态而可见
   */
  private isFeatureVisibleByMarked(dataInstance: EntityDataInstance): boolean {
    if (this.markedFilterMode === MarkedFeatureFilterMode.Marked) {
      return dataInstance.marked;
    }
    if (this.markedFilterMode === MarkedFeatureFilterMode.Unmarked) {
      return !dataInstance.marked;
    }
    return true;
  }

  /**
   * 添加样式到缓存
   */
  private addToStyleCache(key: string, styles: Style[]): void {
    const existingIndex = this.styleCacheKeys.indexOf(key);
    if (existingIndex !== -1) {
      this.styleCacheKeys.splice(existingIndex, 1);
    }

    this.styleCacheKeys.push(key);
    this.styleCache.set(key, styles);

    if (this.styleCacheKeys.length > this.maxStyleCacheSize) {
      const oldestKey = this.styleCacheKeys.shift();
      if (oldestKey) {
        this.styleCache.delete(oldestKey);
      }
    }
  }

  /**
   * 创建样式
   */
  public createStyle(feature: FeatureLike): Style[] {
    let clusterFeatures = feature.get('features') as Feature[] | undefined;

    // 如果不是聚合feature（即直接使用baseSource时），则自身就是数据feature
    if (!clusterFeatures) {
      clusterFeatures = [feature as Feature];
    }

    if (!clusterFeatures || clusterFeatures.length === 0) {
      return [];
    }

    // 获取可见的数据实例
    const visibleInstances: EntityDataInstance[] = [];
    for (const f of clusterFeatures) {
      const instance = f.get(EntityInstanceKey) as EntityDataInstance;
      if (instance && this.isFeatureVisibleByMarked(instance)) {
        visibleInstances.push(instance);
      }
    }

    const size = visibleInstances.length;
    if (size === 0) {
      return [];
    }

    // 单个feature的样式
    if (size === 1) {
      const instance = visibleInstances[0];
      const marked = instance.marked;
      const selected = instance.selected;

      const state: 'selected' | 'normal' = selected ? 'selected' : 'normal';
      // marked状态下整体半透明，selected状态下不透明（或者你可以定义selected也半透明，但在已有逻辑中selected优先级高且通常高亮）
      // 根据用户需求：marked的时候改成整体透明度
      // 假设：marked且未被选中时，透明度为0.4；选中时保持不透明以便查看；普通状态不透明
      let opacity = 1;
      if (marked && !selected) {
        opacity = 0.4;
      }

      const cacheKey = this.generateStyleCacheKey(opacity, state, 1);
      const cachedStyle = this.styleCache.get(cacheKey);
      if (cachedStyle) {
        return cachedStyle;
      }

      const bgStyles =
        state === 'selected' ? EntityGroupStyleProvider.SELECTED_STYLE_BG : EntityGroupStyleProvider.NORMAL_STYLE_BG;

      // 组合基础样式：Base + Background + Icon
      // Apply opacity to ALL styles including icon
      const baseStyles: Style[] = this.enableShadow
        ? [...EntityGroupStyleProvider.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!]
        : [...bgStyles, this.iconStyleCache!];

      const styles = this.applyOpacity(baseStyles, opacity);

      this.addToStyleCache(cacheKey, styles);
      return styles;
    }

    // 聚合feature的样式
    let markedCount = 0;
    let selectedCount = 0;
    for (const instance of visibleInstances) {
      if (instance.marked) markedCount++;
      if (instance.selected) selectedCount++;
    }

    const hasMarked = markedCount > 0;
    const hasSelected = selectedCount > 0;
    const allMarked = markedCount === size;

    let state: 'selected' | 'normal' = hasSelected ? 'selected' : 'normal';

    let opacity = 1;
    if (hasMarked && !hasSelected) {
      // 如果全部都是marked，则淡化；如果部分marked，可能还是保持不透明或者半透明？
      // 逻辑保持类似之前：如果allMarked则淡化更多，如果部分marked则淡化少一点？
      // 这里简化逻辑：只要没有被选中的，且全部marked，就变淡。
      if (allMarked) {
        opacity = 0.4;
      } else {
        // 部分marked，可以稍微淡一点或者不淡
        opacity = 0.7;
      }
    }

    const cacheKey = this.generateStyleCacheKey(opacity, state, size);
    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const bgStyles =
      state === 'selected' ? EntityGroupStyleProvider.SELECTED_STYLE_BG : EntityGroupStyleProvider.NORMAL_STYLE_BG;

    const clusterStyle = createClusterStyle({
      radius: ENTITY_RADIUS,
      size,
    });

    const baseStyles: Style[] = this.enableShadow
      ? [...EntityGroupStyleProvider.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!, clusterStyle]
      : [...bgStyles, this.iconStyleCache!, clusterStyle];

    const styles = this.applyOpacity(baseStyles, opacity);

    this.addToStyleCache(cacheKey, styles);
    return styles;
  }
}
