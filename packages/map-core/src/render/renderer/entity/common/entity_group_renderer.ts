import {
  DEFAULT_CLUSTER_DISTANCE,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';

import {
  createClusterBadgeCanvasStyle,
  createEntityGroupWebGLStyle,
} from '@endfieldmap/map-core/render/renderer/entity/common/entity_group_style';

/**
 * Entity组渲染器配置
 */
export interface EntityGroupRendererConfig {
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
  /** 初始可见性 */
  initialVisible?: boolean;
}

/**
 * 添加 Feature 所需的数据
 */
export interface FeatureData {
  /** 数据实例ID */
  id: number;
  /** 坐标 */
  coordinates: Coordinate;
  /** 数据实例引用（供 hit test 使用） */
  dataInstance: EntityDataInstance;
  /** 是否可见（由 Controller 根据 markedFilterMode 计算） */
  visible: boolean;
  /** 是否被标记 */
  marked: boolean;
  /** 是否被选中 */
  selected: boolean;
  /** 是否激活 */
  active: boolean;
}

/**
 * Feature 状态更新
 */
export interface FeatureStateUpdate {
  visible?: boolean;
  marked?: boolean;
  selected?: boolean;
  active?: boolean;
}

/**
 * Entity组渲染器（WebGL）
 * 负责渲染单个 Entity 组的所有 Entity
 * 使用 WebGLVectorLayer 替代 VectorLayer 以获得更好的渲染性能
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 不包含 MobX 监听
 * - 不维护 markedFilterMode 状态 —— 由 Controller 通过 visible 属性控制
 * - 通过 Controller 显式调用 addFeatures/removeFeatures/updateFeatureState 更新渲染
 */
export class EntityGroupRenderer {
  /** WebGL 图层（主要渲染层） */
  public readonly layer: WebGLVectorLayer;

  /** Canvas 图层（聚合 badge 文本层） */
  public readonly badgeLayer: VectorLayer;

  /** 基础数据源 */
  private readonly baseSource: VectorSource;

  /** 聚合数据源 */
  public readonly clusterSource: Cluster;

  /** Feature 映射：dataInstance.id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  constructor(config: EntityGroupRendererConfig) {
    // 初始化数据源
    this.baseSource = new VectorSource();
    this.clusterSource = new Cluster({
      source: this.baseSource,
      distance: config.enableCluster ? (config.clusterDistance ?? DEFAULT_CLUSTER_DISTANCE) : 0,
      geometryFunction: this.createGeometryFunction(),
    });

    // 监听聚合特征变化，将 clusterSize/marked/selected 写入 cluster feature 属性
    this.setupClusterPropertySync();

    // 生成 WebGL FlatStyle
    const flatStyles = createEntityGroupWebGLStyle({
      iconPath: config.iconPath,
      enableShadow: config.enableShadow,
    });

    // 初始化 WebGL 图层 — 主要渲染层
    this.layer = new WebGLVectorLayer({
      source: this.clusterSource,
      style: flatStyles,
      visible: config.initialVisible ?? true,
      zIndex: 5,
      disableHitDetection: false,
    });
    this.layer.set(LayerTypeKey, LayerType.ENTITY);

    // 初始化 Canvas 图层 — 聚合 badge 文本层
    this.badgeLayer = new VectorLayer({
      source: this.clusterSource,
      style: createClusterBadgeCanvasStyle(),
      visible: config.initialVisible ?? true,
      zIndex: 6, // 确保在 WebGL 层之上
    });
    this.badgeLayer.set(LayerTypeKey, LayerType.ENTITY);
  }

  // #region 公共 API —— 由 Controller 调用

  /**
   * 批量添加 features
   */
  public addFeatures(items: FeatureData[]): void {
    for (const item of items) {
      this.addSingleFeature(item);
    }
    this.clusterSource.refresh();
  }

  /**
   * 批量移除 features
   */
  public removeFeatures(ids: number[]): void {
    for (const id of ids) {
      const feature = this.featureMap.get(id);
      if (feature) {
        this.baseSource.removeFeature(feature);
        this.featureMap.delete(id);
      }
    }
    this.clusterSource.refresh();
  }

  /**
   * 更新单个 feature 的状态
   * 将状态更新写入 feature 属性，WebGL 表达式自动响应
   * @param id feature ID
   * @param state 状态更新
   * @param immediateRefresh 是否立即刷新 cluster（默认 true）。批量更新时传 false，最后统一刷新
   */
  public updateFeatureState(id: number, state: FeatureStateUpdate, immediateRefresh: boolean = true): void {
    const feature = this.featureMap.get(id);
    if (!feature) return;

    // let needClusterRefresh = false;

    if (state.visible !== undefined) {
      feature.set('visible', state.visible ? 1 : 0, true);
      // visible 变化影响 geometryFunction 的过滤
      // needClusterRefresh = true;
    }
    if (state.marked !== undefined) {
      feature.set('marked', state.marked ? 1 : 0, true);
      // marked 变化影响 cluster 的 markedState 计算
      // needClusterRefresh = true;
    }
    if (state.selected !== undefined) {
      feature.set('selected', state.selected ? 1 : 0, true);
      // selected 变化影响 cluster 的 selected 属性
      // needClusterRefresh = true;
    }
    if (state.active !== undefined) {
      feature.set('active', state.active ? 1 : 0, true);
      // active 变化影响 cluster 的 active 属性
      // needClusterRefresh = true;
    }

    feature.changed();

    if (immediateRefresh) {
      this.clusterSource.refresh();
    }
  }

  /**
   * 批量更新所有 features 的状态
   * 用于 markedFilterMode 变化时批量设置 visible
   */
  public updateAllFeaturesState(updater: (id: number, feature: Feature) => FeatureStateUpdate): void {
    for (const [id, feature] of this.featureMap) {
      const state = updater(id, feature);

      if (state.visible !== undefined) {
        feature.set('visible', state.visible ? 1 : 0, true);
      }
      if (state.marked !== undefined) {
        feature.set('marked', state.marked ? 1 : 0, true);
      }
      if (state.selected !== undefined) {
        feature.set('selected', state.selected ? 1 : 0, true);
      }
      if (state.active !== undefined) {
        feature.set('active', state.active ? 1 : 0, true);
      }
    }
    this.layer.changed();
  }

  /**
   * 设置聚合距离
   * distance=0 时 Cluster 不聚合，各 feature 直接透传
   */
  public setClusterDistance(distance: number): void {
    this.clusterSource.setDistance(Math.max(0, distance));
    this.clusterSource.refresh();
    this.layer.changed();
  }

  /**
   * 设置图层可见性（组级别）
   */
  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
    this.badgeLayer.setVisible(visible);
  }

  /**
   * 获取图层可见性
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
    this.badgeLayer.changed();
    this.clusterSource.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    this.featureMap.clear();
    this.baseSource.clear();
    this.layer.dispose();
    this.badgeLayer.dispose();
  }

  // #endregion

  // #region 私有方法

  /**
   * 添加单个 feature
   */
  private addSingleFeature(item: FeatureData): void {
    const feature = new Feature();
    feature.setGeometry(new Point(item.coordinates));
    feature.set(FeatureTypeKey, FeatureType.ENTITY);
    feature.set(EntityInstanceKey, item.dataInstance);

    // 设置属性供 WebGL 表达式读取
    feature.set('visible', item.visible ? 1 : 0);
    feature.set('marked', item.marked ? 1 : 0);
    feature.set('selected', item.selected ? 1 : 0);
    feature.set('active', item.active ? 1 : 0);
    feature.set('clusterSize', 1);

    this.featureMap.set(item.id, feature);
    this.baseSource.addFeature(feature);
  }

  /**
   * 创建几何函数
   * 仅根据 feature 的 visible 属性决定是否渲染
   * visible=0 的 feature 不参与聚合也不渲染
   */
  private createGeometryFunction(): (feature: Feature) => Point | null {
    return (feature: Feature) => {
      const visible = feature.get('visible') as number;
      if (visible === 0) {
        return null;
      }
      return feature.getGeometry() as Point | null;
    };
  }

  /**
   * 设置聚合属性同步
   * 监听 Cluster source 的变化，将聚合属性写入 cluster feature
   */
  private setupClusterPropertySync(): void {
    const syncClusterFeatureProps = (clusterFeature: Feature) => {
      const subFeatures = clusterFeature.get('features') as Feature[] | undefined;
      const size = subFeatures ? subFeatures.length : 1;
      clusterFeature.set('clusterSize', size, true);

      if (subFeatures && subFeatures.length > 0) {
        // 计算 marked 状态：0=都不是, 1=部分marked, 2=全部marked
        const markedCount = subFeatures.filter((f) => f.get('marked') === 1).length;
        let markedState = 0;
        if (markedCount === subFeatures.length) {
          markedState = 2; // 全部marked
        } else if (markedCount > 0) {
          markedState = 1; // 部分marked
        }

        // 计算 selected 状态：0=都不是, 1=部分selected, 2=全部selected
        const selectedCount = subFeatures.filter((f) => f.get('selected') === 1).length;
        let selectedState = 0;
        if (selectedCount === subFeatures.length) {
          selectedState = 2; // 全部selected
        } else if (selectedCount > 0) {
          selectedState = 1; // 部分selected
        }

        const hasActive = subFeatures.some((f) => f.get('active') === 1) ? 1 : 0;

        // marked 保持兼容性（有任何一个marked就是1）
        clusterFeature.set('marked', markedCount > 0 ? 1 : 0, true);
        // markedState 用于更精细的透明度控制
        clusterFeature.set('markedState', markedState, true);

        // selected 保持兼容性（有任何一个selected就是1）
        clusterFeature.set('selected', selectedCount > 0 ? 1 : 0, true);
        // selectedState 用于更精细的透明度控制
        clusterFeature.set('selectedState', selectedState, true);

        clusterFeature.set('active', hasActive, true);
      }
    };

    this.clusterSource.on('addfeature', (event) => {
      if (event.feature) {
        syncClusterFeatureProps(event.feature);
      }
    });

    this.clusterSource.on('change', () => {
      const features = this.clusterSource.getFeatures();
      for (const clusterFeature of features) {
        syncClusterFeatureProps(clusterFeature);
      }
    });
  }

  // #endregion
}
