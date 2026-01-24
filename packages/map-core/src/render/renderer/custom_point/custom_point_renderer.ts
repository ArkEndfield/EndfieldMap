import {
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import type { CustomPointDataInstance, CustomPointDataManager } from '@endfieldmap/map-core/data/entity/custom_point';
import { createEntityBackgroundStyles, createEntityIconStyles } from '@endfieldmap/map-core/render/factory';
import { type IReactionDisposer, reaction } from 'mobx';
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';

const ENTITY_RADIUS = DEFAULT_ICON_SIZE / 2;

/**
 * 自定义标点渲染器配置
 */
export interface CustomPointRendererConfig {
  /** 数据管理器 */
  dataManager: CustomPointDataManager;
  /** 图标基础路径 */
  imagePath: string;
  /** 图标大小 */
  iconSize?: number;
  /** 渲染缓冲区 */
  renderBuffer?: number;
}

/**
 * Feature映射信息
 */
interface FeatureMapping {
  feature: Feature;
  dataInstance: CustomPointDataInstance;
  disposer: IReactionDisposer;
}

// 自定义标点使用深色样式
const CUSTOM_POINT_FILL_COLOR = '#3A3A3A';
const CUSTOM_POINT_FILL_COLOR_50 = 'rgba(58, 58, 58, 0.5)';
const CUSTOM_POINT_FILL_COLOR_75 = 'rgba(58, 58, 58, 0.75)';
const CUSTOM_POINT_STROKE_COLOR = '#1A1A1A';
const CUSTOM_POINT_STROKE_COLOR_50 = 'rgba(26, 26, 26, 0.5)';
const CUSTOM_POINT_STROKE_COLOR_75 = 'rgba(26, 26, 26, 0.75)';

/**
 * 自定义标点渲染器
 * 负责渲染自定义标点
 */
export class CustomPointRenderer {
  /** 是否是多图层（用于兼容 UnionLayerBase 接口） */
  public readonly isMultiLayer = false;

  /** 数据管理器 */
  public readonly dataManager: CustomPointDataManager;

  /** 图层实例 */
  public readonly layer: VectorLayer;

  /** 数据源 */
  private readonly source: VectorSource;

  /** Feature映射 */
  private featureMappings: Map<number, FeatureMapping> = new Map();

  /** 图标样式缓存 */
  private iconStyleCache: Map<string, Style> = new Map();

  /** 组合样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();

  /** 图标基础路径 */
  private imagePath: string;

  /** 图标大小 */
  private iconSize: number;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  /** 背景样式 */
  private static readonly BACKGROUND_STYLES = createEntityBackgroundStyles(
    ENTITY_RADIUS,
    DEFAULT_STROKE_WIDTH,
    {
      '100': CUSTOM_POINT_FILL_COLOR,
      '50': CUSTOM_POINT_FILL_COLOR_50,
      '75': CUSTOM_POINT_FILL_COLOR_75,
    },
    {
      '100': CUSTOM_POINT_STROKE_COLOR,
      '50': CUSTOM_POINT_STROKE_COLOR_50,
      '75': CUSTOM_POINT_STROKE_COLOR_75,
    }
  );

  /**
   * 获取可见性（用于与旧架构接口兼容）
   */
  public get visible(): boolean {
    return this.layer.getVisible();
  }

  constructor(config: CustomPointRendererConfig) {
    this.dataManager = config.dataManager;
    this.imagePath = config.imagePath;
    this.iconSize = config.iconSize ?? DEFAULT_ICON_SIZE;

    // 初始化数据源
    this.source = new VectorSource();

    // 初始化图层
    this.layer = new VectorLayer({
      source: this.source,
      style: this.createStyle.bind(this),
      zIndex: 6,
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
    });
    this.layer.set(LayerTypeKey, LayerType.CUSTOM_POINT);

    // 初始化features
    this.initializeFeatures();

    // 设置数据变化监听
    this.setupDataManagerReaction();
  }

  /**
   * 初始化所有features
   */
  private initializeFeatures(): void {
    for (const instance of this.dataManager.instances) {
      this.addFeatureForInstance(instance);
    }
  }

  /**
   * 为数据实例添加feature
   */
  private addFeatureForInstance(dataInstance: CustomPointDataInstance): void {
    const feature = new Feature();
    const coordinates = dataInstance.coordinates;
    feature.setGeometry(new Point(coordinates));
    feature.set(FeatureTypeKey, FeatureType.ENTITY);
    feature.set(EntityInstanceKey, dataInstance);

    // 设置状态变化监听
    const disposer = reaction(
      () => ({
        active: dataInstance.active,
        visible: dataInstance.visible,
        typeId: dataInstance.typeId,
      }),
      () => {
        feature.changed();
      },
      { fireImmediately: true }
    );

    this.featureMappings.set(dataInstance.id, {
      feature,
      dataInstance,
      disposer,
    });

    this.source.addFeature(feature);
  }

  /**
   * 移除数据实例的feature
   */
  private removeFeatureForInstance(id: number): void {
    const mapping = this.featureMappings.get(id);
    if (mapping) {
      mapping.disposer();
      this.source.removeFeature(mapping.feature);
      this.featureMappings.delete(id);
    }
  }

  /**
   * 设置数据管理器变化监听
   */
  private setupDataManagerReaction(): void {
    const disposer = reaction(
      () => this.dataManager.instances.map((i) => i.id),
      (newIds, oldIds) => {
        const oldIdSet = new Set(oldIds);
        const newIdSet = new Set(newIds);

        if (oldIds && oldIds.length > 0) {
          for (const id of oldIds) {
            if (!newIdSet.has(id)) {
              this.removeFeatureForInstance(id);
            }
          }
        }

        for (const instance of this.dataManager.instances) {
          if (!oldIdSet.has(instance.id)) {
            this.addFeatureForInstance(instance);
          }
        }
      },
      { fireImmediately: true }
    );
    this.disposers.push(disposer);
  }

  /**
   * 获取或创建图标样式
   */
  private getOrCreateIconStyle(iconName: string): Style {
    if (!this.iconStyleCache.has(iconName)) {
      const iconStyle = createEntityIconStyles({
        url: `${this.imagePath}/${iconName}.png`,
        size: this.iconSize,
        radius: ENTITY_RADIUS,
        borderWidth: DEFAULT_STROKE_WIDTH,
      });
      this.iconStyleCache.set(iconName, iconStyle);
    }
    return this.iconStyleCache.get(iconName)!;
  }

  /**
   * 创建样式
   */
  private createStyle(feature: FeatureLike): Style[] {
    const dataInstance = feature.get(EntityInstanceKey) as CustomPointDataInstance | undefined;
    if (!dataInstance) {
      return [];
    }

    // 如果不可见，返回空数组
    if (!dataInstance.visible) {
      return [];
    }

    const iconName = dataInstance.iconName;
    const active = dataInstance.active;

    // 计算透明度
    const fillOpacity: '50' | '75' | '100' = active ? '75' : '100';
    const strokeOpacity: '50' | '75' | '100' = fillOpacity;

    const cacheKey = `${iconName}-${fillOpacity}-${strokeOpacity}`;

    if (!this.styleCache.has(cacheKey)) {
      const bgKey = `${fillOpacity}-${strokeOpacity}`;
      const bgStyles = CustomPointRenderer.BACKGROUND_STYLES[bgKey];
      const iconStyle = this.getOrCreateIconStyle(iconName);
      const styles = [...bgStyles, iconStyle];
      this.styleCache.set(cacheKey, styles);
    }

    return this.styleCache.get(cacheKey)!;
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
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    for (const mapping of this.featureMappings.values()) {
      mapping.disposer();
    }
    this.featureMappings.clear();

    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];

    this.source.clear();
  }
}
