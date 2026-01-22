import {
  DEFAULT_CLUSTER_DISTANCE,
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
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
  type MapIndex,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance, EntityGroupManager } from '@endfieldmap/map-core/data/entity';
import {
  createBlurredShadowStyles,
  createClusterStyle,
  createEntityBackgroundStyles,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import { xyz2crd } from '@endfieldmap/tools';
import { type IReactionDisposer,reaction } from 'mobx';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

/**
 * Entity组渲染器配置
 */
export interface EntityGroupRendererConfig {
  /** 数据管理器 */
  dataManager: EntityGroupManager;
  /** 图标路径 */
  iconPath: string;
  /** 是否启用聚合 */
  enableCluster?: boolean;
  /** 聚合距离 */
  clusterDistance?: number;
  /** 渲染缓冲区 */
  renderBuffer?: number;
  /** 是否启用阴影 */
  enableShadow?: boolean;
  /** 样式缓存最大数量 */
  maxStyleCacheSize?: number;
}

/**
 * Feature到数据实例的映射类型
 */
interface FeatureDataMapping {
  feature: Feature;
  dataInstance: EntityDataInstance;
  disposer: IReactionDisposer;
}

/**
 * Entity组渲染器
 * 负责渲染单个EntityGroupManager中的所有Entity
 */
export class EntityGroupRenderer {
  /** 地图索引 */
  public readonly mapIndex: MapIndex;

  /** 数据管理器 */
  public readonly dataManager: EntityGroupManager;

  /** 图层实例 */
  public readonly layer: VectorLayer;

  /** 基础数据源 */
  private readonly baseSource: VectorSource;

  /** 聚合数据源 */
  public readonly clusterSource: Cluster;

  /** Feature到数据实例的映射 */
  private featureMappings: Map<number, FeatureDataMapping> = new Map();

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

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  /** 背景样式 - 选中状态 */
  private static readonly SELECTED_STYLE_BG = createEntityBackgroundStyles(
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
    }
  );

  /** 背景样式 - 普通状态 */
  private static readonly NORMAL_STYLE_BG = createEntityBackgroundStyles(
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
  );

  /** 阴影样式 */
  private static BASE_BACKDROP_STYLE: Style[] = [];

  constructor(config: EntityGroupRendererConfig) {
    this.dataManager = config.dataManager;
    this.mapIndex = config.dataManager.mapIndex;
    this.enableShadow = config.enableShadow ?? false;
    this.maxStyleCacheSize = config.maxStyleCacheSize ?? 1000;

    // 初始化数据源
    this.baseSource = new VectorSource();
    this.clusterSource = new Cluster({
      source: this.baseSource,
      distance: config.enableCluster ? (config.clusterDistance ?? DEFAULT_CLUSTER_DISTANCE) : 0,
      geometryFunction: this.createGeometryFunction(),
    });

    // 初始化图层
    this.layer = new VectorLayer({
      source: this.clusterSource,
      style: this.createStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: this.dataManager.groupVisible,
      zIndex: 5,
      declutter: false,
    });
    this.layer.set(LayerTypeKey, LayerType.ENTITY);

    // 初始化图标样式
    this.iconStyleCache = createEntityIconStyles({
      url: config.iconPath,
      size: DEFAULT_ICON_SIZE,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
    });

    // 初始化阴影样式
    if (this.enableShadow) {
      EntityGroupRenderer.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
    }

    // 初始化features
    this.initializeFeatures();

    // 设置数据变化监听
    this.setupDataManagerReaction();
  }

  /**
   * 创建几何函数，用于过滤不可见的feature
   */
  private createGeometryFunction(): (feature: Feature) => Point | null {
    return (feature: Feature) => {
      const dataInstance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
      if (!dataInstance) {
        return feature.getGeometry() as Point | null;
      }

      // 根据marked过滤模式判断是否参与聚合
      if (this.markedFilterMode === MarkedFeatureFilterMode.Marked && !dataInstance.marked) {
        return null;
      }
      if (this.markedFilterMode === MarkedFeatureFilterMode.Unmarked && dataInstance.marked) {
        return null;
      }

      return feature.getGeometry() as Point | null;
    };
  }

  /**
   * 初始化所有features
   */
  private initializeFeatures(): void {
    for (const dataInstance of this.dataManager.instances) {
      this.addFeatureForInstance(dataInstance);
    }
  }

  /**
   * 为数据实例添加feature
   */
  private addFeatureForInstance(dataInstance: EntityDataInstance): void {
    const feature = new Feature();
    const coordinates = xyz2crd(dataInstance.position, this.mapIndex);
    feature.setGeometry(new Point(coordinates));
    feature.set(FeatureTypeKey, FeatureType.ENTITY);
    feature.set(EntityInstanceKey, dataInstance);

    // 设置状态变化监听
    const disposer = reaction(
      () => ({
        marked: dataInstance.marked,
        selected: dataInstance.selected,
        active: dataInstance.active,
        visible: dataInstance.visible,
      }),
      () => {
        feature.changed();
        // 使用 refresh() 确保 marked 状态变化时 geometryFunction 重新执行
        // 这在筛选模式为 marked/unmarked 时尤为重要
        this.clusterSource.refresh();
      }
    );

    this.featureMappings.set(dataInstance.id, {
      feature,
      dataInstance,
      disposer,
    });

    this.baseSource.addFeature(feature);
  }

  /**
   * 移除数据实例的feature
   */
  private removeFeatureForInstance(id: number): void {
    const mapping = this.featureMappings.get(id);
    if (mapping) {
      mapping.disposer();
      this.baseSource.removeFeature(mapping.feature);
      this.featureMappings.delete(id);
    }
  }

  /**
   * 设置数据管理器变化监听
   */
  private setupDataManagerReaction(): void {
    // 监听instances数组变化
    const disposer = reaction(
      () => this.dataManager.instances.map((i) => i.id),
      (newIds, oldIds) => {
        const oldIdSet = new Set(oldIds);
        const newIdSet = new Set(newIds);

        // 移除已删除的
        for (const id of oldIds) {
          if (!newIdSet.has(id)) {
            this.removeFeatureForInstance(id);
          }
        }

        // 添加新增的
        for (const instance of this.dataManager.instances) {
          if (!oldIdSet.has(instance.id)) {
            this.addFeatureForInstance(instance);
          }
        }
      }
    );
    this.disposers.push(disposer);

    // 监听组可见性变化
    const visibilityDisposer = reaction(
      () => this.dataManager.groupVisible,
      (visible) => {
        this.layer.setVisible(visible);
        // 当图层变为可见时，需要刷新 clusterSource 以重新应用 marked 筛选模式
        // 使用 refresh() 强制重新计算聚合，因为 geometryFunction 需要重新执行
        if (visible) {
          this.clusterSource.refresh();
        }
      }
    );
    this.disposers.push(visibilityDisposer);
  }

  /**
   * 生成样式缓存键
   */
  private generateStyleCacheKey(
    fillOpacity: '50' | '75' | '100',
    strokeOpacity: '50' | '75' | '100',
    state: 'active' | 'selected' | 'normal',
    size: number
  ): string {
    return `${fillOpacity}-${strokeOpacity}-${state}-${size}`;
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
   * 创建样式
   */
  private createStyle(feature: FeatureLike): Style[] {
    const clusterFeatures = feature.get('features') as Feature[] | undefined;
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

      const fillOpacity: '50' | '75' | '100' = marked ? '50' : '100';
      const strokeOpacity: '50' | '75' | '100' = selected ? '50' : fillOpacity;
      const state: 'selected' | 'normal' = selected ? 'selected' : 'normal';

      const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state, 1);
      const cachedStyle = this.styleCache.get(cacheKey);
      if (cachedStyle) {
        return cachedStyle;
      }

      const bgStyles =
        state === 'selected'
          ? EntityGroupRenderer.SELECTED_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]
          : EntityGroupRenderer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];

      const styles: Style[] = this.enableShadow
        ? [...EntityGroupRenderer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!]
        : [...bgStyles, this.iconStyleCache!];

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
    const allSelected = selectedCount === size;

    let fillOpacity: '50' | '75' | '100' = '100';
    if (hasMarked) {
      fillOpacity = allMarked ? '50' : '75';
    }

    let strokeOpacity: '50' | '75' | '100' = '100';
    let state: 'selected' | 'normal' = 'normal';

    if (hasSelected) {
      state = 'selected';
      strokeOpacity = allSelected ? '50' : '75';
    } else {
      strokeOpacity = fillOpacity;
    }

    const cacheKey = this.generateStyleCacheKey(fillOpacity, strokeOpacity, state, size);
    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const bgStyles =
      state === 'selected'
        ? EntityGroupRenderer.SELECTED_STYLE_BG[`${fillOpacity}-${strokeOpacity}`]
        : EntityGroupRenderer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];

    const clusterStyle = createClusterStyle({
      radius: ENTITY_RADIUS,
      size,
    });

    const styles: Style[] = this.enableShadow
      ? [...EntityGroupRenderer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!, clusterStyle]
      : [...bgStyles, this.iconStyleCache!, clusterStyle];

    this.addToStyleCache(cacheKey, styles);
    return styles;
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
   * 设置marked过滤模式
   */
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.markedFilterMode === mode) {
      return;
    }
    this.markedFilterMode = mode;
    // 需要调用 refresh() 强制重新计算聚合，changed() 不足以触发 geometryFunction 重新执行
    this.clusterSource.refresh();
  }

  /**
   * 设置聚合距离
   */
  public setClusterDistance(distance: number): void {
    this.clusterSource.setDistance(distance);
  }

  /**
   * 设置可见性
   */
  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
  }

  /**
   * 获取可见性
   */
  public getVisible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 可见性 getter（实现 HitTestableLayer 接口）
   */
  public get visible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 获取最接近指定坐标的聚合中心坐标
   * @param coordinate 目标坐标
   * @returns 聚合中心坐标，如果没有找到则返回 null
   */
  public getClosestClusterCenter(coordinate: Coordinate): Coordinate | null {
    const source = this.layer.getSource();
    const clusterFeature = source?.getClosestFeatureToCoordinate(coordinate);
    const geometry = clusterFeature?.getGeometry();
    if (geometry && geometry.getType() === 'Point') {
      return (geometry as Point).getCoordinates();
    }
    return null;
  }

  /**
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
    this.clusterSource.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    // 清理所有feature的disposers
    for (const mapping of this.featureMappings.values()) {
      mapping.disposer();
    }
    this.featureMappings.clear();

    // 清理数据管理器监听
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];

    // 清理数据源
    this.baseSource.clear();
  }
}
