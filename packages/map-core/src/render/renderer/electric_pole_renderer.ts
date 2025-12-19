import {
  DEFAULT_FILL_COLOR,
  DEFAULT_FILL_COLOR_TRANSPARENT_50,
  DEFAULT_FILL_COLOR_TRANSPARENT_75,
  DEFAULT_ICON_SIZE,
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
} from '@endfieldmap/map-core/const/map';
import type { ElectricPoleDataInstance, ElectricPoleDataManager } from '@endfieldmap/map-core/data/electric_pole';
import {
  createBlurredShadowStyles,
  createEntityBackgroundStyles,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import { action, type IReactionDisposer, observable, reaction } from 'mobx';
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

/**
 * 电线杆渲染器配置
 */
export interface ElectricPoleRendererConfig {
  /** 数据管理器 */
  dataManager: ElectricPoleDataManager;
  /** 图标路径 */
  iconPath: string;
  /** 图标大小 */
  iconSize?: number;
  /** 渲染缓冲区 */
  renderBuffer?: number;
  /** 是否启用阴影 */
  enableShadow?: boolean;
}

/**
 * Feature映射信息
 */
interface FeatureMapping {
  /** 点feature */
  pointFeature: Feature;
  /** 连线feature */
  connectionFeature: Feature;
  /** 数据实例 */
  dataInstance: ElectricPoleDataInstance;
  /** reaction disposer */
  disposer: IReactionDisposer;
}

/**
 * 电线杆渲染器
 * 负责渲染电线杆实体和连接线
 */
export class ElectricPoleRenderer {
  /** 地图索引 */
  public readonly mapIndex: MapIndex;

  /** 数据管理器 */
  public readonly dataManager: ElectricPoleDataManager;

  /** 实体图层 */
  public readonly entityLayer: VectorLayer;

  /** 连线图层 */
  public readonly connectionLayer: VectorLayer;

  /** 当前hover的连线feature */
  @observable accessor hoveredFeature: FeatureLike | null = null;

  /**
   * 可见性 getter（实现 HitTestableLayer 接口）
   */
  public get visible(): boolean {
    return this.entityLayer.getVisible();
  }

  /**
   * 图层 getter（实现 HitTestableLayer 接口）
   */
  public get layer(): VectorLayer {
    return this.entityLayer;
  }

  /** 实体数据源 */
  private readonly entitySource: VectorSource;

  /** 连线数据源 */
  private readonly connectionSource: VectorSource;

  /** Feature映射 */
  private featureMappings: Map<number, FeatureMapping> = new Map();

  /** 样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();

  /** 图标样式缓存 */
  private iconStyleCache: Style | null = null;

  /** 是否启用阴影 */
  private enableShadow: boolean;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  /** 背景样式 */
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

  /** 连线普通样式 */
  private static readonly CONNECTION_STYLE_NORMAL = new Style({
    stroke: new Stroke({
      color: '#FFD700',
      width: 2,
    }),
  });

  /** 连线hover样式 */
  private static readonly CONNECTION_STYLE_HOVER = new Style({
    stroke: new Stroke({
      color: '#FFA500',
      width: 4,
    }),
  });

  constructor(config: ElectricPoleRendererConfig) {
    this.dataManager = config.dataManager;
    this.mapIndex = config.dataManager.mapIndex;
    this.enableShadow = config.enableShadow ?? false;

    // 初始化数据源
    this.entitySource = new VectorSource();
    this.connectionSource = new VectorSource();

    // 初始化图层
    this.entityLayer = new VectorLayer({
      source: this.entitySource,
      style: this.createEntityStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: true,
      zIndex: 6,
      declutter: false,
    });
    this.entityLayer.set(LayerTypeKey, LayerType.ELECTRIC_POLE);

    this.connectionLayer = new VectorLayer({
      source: this.connectionSource,
      style: this.createConnectionStyle.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      visible: true,
      zIndex: 4,
    });

    // 初始化图标样式
    const iconSize = config.iconSize ?? DEFAULT_ICON_SIZE;
    this.iconStyleCache = createEntityIconStyles({
      url: config.iconPath,
      size: iconSize,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
    });

    // 初始化阴影样式
    if (this.enableShadow) {
      ElectricPoleRenderer.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
    }

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
  private addFeatureForInstance(dataInstance: ElectricPoleDataInstance): void {
    // 创建点feature
    const pointFeature = new Feature();
    const coordinates = dataInstance.coordinates;
    pointFeature.setGeometry(new Point(coordinates));
    pointFeature.set(FeatureTypeKey, FeatureType.ENTITY);
    pointFeature.set(EntityInstanceKey, dataInstance);

    // 创建连线feature
    const connectionFeature = new Feature();
    connectionFeature.set(FeatureTypeKey, FeatureType.CONNECTION);
    connectionFeature.set(EntityInstanceKey, dataInstance);

    // 更新连线几何
    this.updateConnectionGeometry(dataInstance, connectionFeature);

    // 设置状态变化监听
    const disposer = reaction(
      () => ({
        active: dataInstance.active,
        visible: dataInstance.visible,
        connectionTo: dataInstance.connectionTo,
      }),
      () => {
        pointFeature.changed();
        this.updateConnectionGeometry(dataInstance, connectionFeature);
      }
    );

    this.featureMappings.set(dataInstance.id, {
      pointFeature,
      connectionFeature,
      dataInstance,
      disposer,
    });

    this.entitySource.addFeature(pointFeature);
    this.connectionSource.addFeature(connectionFeature);
  }

  /**
   * 更新连线几何
   */
  private updateConnectionGeometry(dataInstance: ElectricPoleDataInstance, feature: Feature): void {
    const targetInstance = dataInstance.connectionTo;
    if (targetInstance) {
      const fromCoords = dataInstance.coordinates;
      const toCoords = targetInstance.coordinates;
      feature.setGeometry(new LineString([fromCoords, toCoords]));
    } else {
      feature.setGeometry(undefined);
    }
  }

  /**
   * 移除数据实例的feature
   */
  private removeFeatureForInstance(id: number): void {
    const mapping = this.featureMappings.get(id);
    if (mapping) {
      mapping.disposer();
      this.entitySource.removeFeature(mapping.pointFeature);
      this.connectionSource.removeFeature(mapping.connectionFeature);
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
  }

  /**
   * 生成样式缓存键
   */
  private generateStyleCacheKey(fillOpacity: '50' | '75' | '100', state: 'active' | 'normal'): string {
    return `${fillOpacity}-${state}`;
  }

  /**
   * 创建实体样式
   */
  private createEntityStyle(feature: FeatureLike): Style[] {
    const dataInstance = feature.get(EntityInstanceKey) as ElectricPoleDataInstance | undefined;
    if (!dataInstance) {
      return [];
    }

    // 根据状态计算透明度
    let fillOpacity: '50' | '75' | '100' = '100';
    if (dataInstance.active) {
      fillOpacity = '75';
    }

    const state: 'active' | 'normal' = dataInstance.active ? 'active' : 'normal';
    const cacheKey = this.generateStyleCacheKey(fillOpacity, state);

    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const bgStyles = ElectricPoleRenderer.NORMAL_STYLE_BG[`${fillOpacity}-${fillOpacity}`];
    const styles: Style[] = this.enableShadow
      ? [...ElectricPoleRenderer.BASE_BACKDROP_STYLE, ...bgStyles, this.iconStyleCache!]
      : [...bgStyles, this.iconStyleCache!];

    this.styleCache.set(cacheKey, styles);
    return styles;
  }

  /**
   * 设置实体图层可见性
   */
  public setEntityVisible(visible: boolean): void {
    this.entityLayer.setVisible(visible);
  }

  /**
   * 设置连线图层可见性
   */
  public setConnectionVisible(visible: boolean): void {
    this.connectionLayer.setVisible(visible);
  }

  /**
   * 获取连线图层可见性
   */
  public getConnectionVisible(): boolean {
    return this.connectionLayer.getVisible();
  }

  /**
   * 获取指定像素位置的连线 features
   * @param pixel 像素坐标
   */
  public async getConnectionFeatures(pixel: [number, number]): Promise<FeatureLike[]> {
    return this.connectionLayer.getFeatures(pixel);
  }

  /**
   * 设置所有图层可见性
   */
  public setVisible(visible: boolean): void {
    this.entityLayer.setVisible(visible);
    this.connectionLayer.setVisible(visible);
  }

  /**
   * 刷新渲染
   */
  public refresh(): void {
    this.entityLayer.changed();
    this.connectionLayer.changed();
  }

  /**
   * 创建连线样式
   * @param feature 连线feature
   * @returns 样式
   */
  private createConnectionStyle(feature: FeatureLike): Style {
    const isHovered = this.hoveredFeature === feature;
    return isHovered
      ? ElectricPoleRenderer.CONNECTION_STYLE_HOVER
      : ElectricPoleRenderer.CONNECTION_STYLE_NORMAL;
  }

  /**
   * 设置hover的连线feature
   * @param feature hover的feature
   */
  @action
  public setHoveredFeature(feature: FeatureLike | null): void {
    if (this.hoveredFeature === feature) {
      return;
    }
    this.hoveredFeature = feature;
    // 触发图层重新渲染
    this.connectionLayer.changed();
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

    this.entitySource.clear();
    this.connectionSource.clear();
  }
}
