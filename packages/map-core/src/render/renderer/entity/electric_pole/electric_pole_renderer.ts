import {
  ConnectionTargetIdKey,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core/const/map';
import type {
  ElectricPoleDataInstance,
  ElectricPoleDataManager,
} from '@endfieldmap/map-core/data/entity/electric_pole';
import { action, type IReactionDisposer, observable, reaction } from 'mobx';
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import { ElectricPoleStyleProvider } from './electric_pole_style';

/**
 * 电线杆渲染器配置
 */
export interface ElectricPoleRendererConfig {
  /** 数据管理器 */
  dataManager: ElectricPoleDataManager;
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
  /** 连线features（targetId -> feature） */
  connectionFeatures: Map<number, Feature>;
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

  /** 样式提供者 */
  private styleProvider: ElectricPoleStyleProvider;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  constructor(config: ElectricPoleRendererConfig) {
    this.dataManager = config.dataManager;
    // 初始化样式提供者
    this.styleProvider = new ElectricPoleStyleProvider({
      iconSize: config.iconSize,
      enableShadow: config.enableShadow,
    });

    // 初始化数据源
    this.entitySource = new VectorSource();
    this.connectionSource = new VectorSource();

    // 初始化图层
    this.entityLayer = new VectorLayer({
      source: this.entitySource,
      style: this.styleProvider.createEntityStyle.bind(this.styleProvider),
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
      style: (feature) => this.styleProvider.createConnectionStyle(feature, this.hoveredFeature),
      renderBuffer: config.renderBuffer ?? 100,
      visible: true,
      zIndex: 4,
    });

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

    // 创建连线 features
    const connectionFeatures = new Map<number, Feature>();
    this.syncConnectionFeatures(dataInstance, connectionFeatures);

    // 设置状态变化监听
    const disposer = reaction(
      () => ({
        active: dataInstance.active,
        visible: dataInstance.visible,
        outgoingIds: dataInstance.outgoingConnections.map((p) => p.id),
      }),
      () => {
        pointFeature.changed();
        this.syncConnectionFeatures(dataInstance, connectionFeatures);
      },
      { fireImmediately: true }
    );

    this.featureMappings.set(dataInstance.id, {
      pointFeature,
      connectionFeatures,
      dataInstance,
      disposer,
    });

    this.entitySource.addFeature(pointFeature);
  }

  /**
   * 同步单个实例的所有连线 features（只渲染“发出”的连线）
   */
  private syncConnectionFeatures(dataInstance: ElectricPoleDataInstance, featureMap: Map<number, Feature>): void {
    const fromCoords = dataInstance.coordinates;
    const currentTargets = new Set<number>(
      dataInstance.visible ? dataInstance.outgoingConnections.filter((p) => p.visible).map((p) => p.id) : []
    );

    // remove missing
    for (const [targetId, feature] of featureMap.entries()) {
      if (!currentTargets.has(targetId)) {
        if (this.hoveredFeature === feature) {
          this.hoveredFeature = null;
        }
        this.connectionSource.removeFeature(feature);
        featureMap.delete(targetId);
      }
    }

    // add/update current
    for (const target of dataInstance.outgoingConnections) {
      if (!dataInstance.visible || !target.visible) {
        continue;
      }
      const targetId = target.id;
      const toCoords = target.coordinates;

      const existing = featureMap.get(targetId);
      if (existing) {
        existing.setGeometry(new LineString([fromCoords, toCoords]));
        continue;
      }

      const connectionFeature = new Feature();
      connectionFeature.set(FeatureTypeKey, FeatureType.CONNECTION);
      connectionFeature.set(EntityInstanceKey, dataInstance);
      connectionFeature.set(ConnectionTargetIdKey, targetId);
      connectionFeature.setGeometry(new LineString([fromCoords, toCoords]));
      featureMap.set(targetId, connectionFeature);
      this.connectionSource.addFeature(connectionFeature);
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
      for (const feature of mapping.connectionFeatures.values()) {
        if (this.hoveredFeature === feature) {
          this.hoveredFeature = null;
        }
        this.connectionSource.removeFeature(feature);
      }
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
