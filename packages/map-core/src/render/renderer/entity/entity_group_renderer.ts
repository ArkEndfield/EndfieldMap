import {
  DEFAULT_CLUSTER_DISTANCE,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance, EntityGroupManager } from '@endfieldmap/map-core/data/entity';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { type IReactionDisposer, reaction } from 'mobx';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';

import { EntityGroupStyleProvider } from './entity_group_style';

/**
 * Entity组渲染器配置
 */
export interface EntityGroupRendererConfig {
  /** 数据管理器 */
  dataManager: EntityGroupManager;
  /** 图标路径 */
  iconPath: string;
  /** 过滤模式 */
  markedFilterMode?: MarkedFeatureFilterMode;
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
  /** 地图数据管理器 */
  mapDataManager?: MapDataManager;
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

  /** 样式提供者 */
  private styleProvider: EntityGroupStyleProvider;

  /** 当前marked过滤模式 */
  private markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  constructor(config: EntityGroupRendererConfig) {
    this.dataManager = config.dataManager;

    // 初始化样式提供者
    this.styleProvider = new EntityGroupStyleProvider({
      iconPath: config.iconPath,
      enableShadow: config.enableShadow,
      maxStyleCacheSize: config.maxStyleCacheSize,
      markedFilterMode: config.markedFilterMode,
    });

    if (config.markedFilterMode) {
      this.markedFilterMode = config.markedFilterMode;
    }

    // 初始化数据源
    this.baseSource = new VectorSource();
    this.clusterSource = new Cluster({
      source: this.baseSource,
      distance: config.enableCluster ? (config.clusterDistance ?? DEFAULT_CLUSTER_DISTANCE) : 0,
      geometryFunction: this.createGeometryFunction(),
    });

    // 初始化图层
    const initialDistance = config.enableCluster ? (config.clusterDistance ?? DEFAULT_CLUSTER_DISTANCE) : 0;
    this.layer = new VectorLayer({
      source: initialDistance > 0 ? this.clusterSource : this.baseSource,
      style: this.styleProvider.createStyle.bind(this.styleProvider),
      renderBuffer: config.renderBuffer ?? 100,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      visible: this.dataManager.groupVisible,
      zIndex: 5,
      declutter: false,
    });
    this.layer.set(LayerTypeKey, LayerType.ENTITY);

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
   * 为数据实例添加feature
   */
  private addFeatureForInstance(dataInstance: EntityDataInstance): void {
    const feature = new Feature();
    const coordinates = dataInstance.coordinates;
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
      },
      { fireImmediately: true }
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
        if (oldIds && oldIds.length > 0) {
          for (const id of oldIds) {
            if (!newIdSet.has(id)) {
              this.removeFeatureForInstance(id);
            }
          }
        }

        // 添加新增的
        for (const instance of this.dataManager.instances) {
          if (!oldIdSet.has(instance.id)) {
            this.addFeatureForInstance(instance);
          }
        }
      },
      { fireImmediately: true }
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
      },
      { fireImmediately: true }
    );
    this.disposers.push(visibilityDisposer);
  }

  /**
   * 设置marked过滤模式
   */
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.markedFilterMode === mode) {
      return;
    }
    this.markedFilterMode = mode;
    this.styleProvider.setMarkedFilterMode(mode);
    // 需要调用 refresh() 强制重新计算聚合，changed() 不足以触发 geometryFunction 重新执行
    this.clusterSource.refresh();
  }

  /**
   * 设置聚合距离
   */
  public setClusterDistance(distance: number): void {
    const currentSource = this.layer.getSource();

    if (distance <= 0) {
      // 禁用聚合：切换到 baseSource
      if (currentSource !== this.baseSource) {
        this.layer.setSource(this.baseSource);
      }
    } else {
      // 启用聚合：切换到 clusterSource 并设置距离
      this.clusterSource.setDistance(distance);
      this.clusterSource.refresh();
      if (currentSource !== this.clusterSource) {
        this.layer.setSource(this.clusterSource);
      }
    }
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
