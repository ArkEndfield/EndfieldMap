import {
  CONNECTION_STYLE_HOVER,
  CONNECTION_STYLE_NORMAL,
  createElectricPoleCanvasStyle,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole/electric_pole_style';
import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import {
  ConnectionTargetIdKey,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

/**
 * 电线杆渲染器配置
 */
export interface ElectricPoleRendererConfig {
  /** 图标路径 */
  iconPath: string;
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
export interface ElectricPoleFeatureData {
  /** 数据实例ID */
  id: number;
  /** 坐标 */
  coordinates: Coordinate;
  /** 数据实例引用（供 hit test 使用） */
  dataInstance: ElectricPoleDataInstance;
  /** 是否可见 */
  visible: boolean;
  /** 是否激活 */
  active: boolean;
}

/**
 * Feature 状态更新
 */
export interface ElectricPoleFeatureStateUpdate {
  visible?: boolean;
  active?: boolean;
}

/**
 * 连线数据
 */
export interface ConnectionData {
  /** 起始实例 */
  fromInstance: ElectricPoleDataInstance;
  /** 起始坐标 */
  fromCoordinates: Coordinate;
  /** 目标实例ID */
  targetId: number;
  /** 目标坐标 */
  targetCoordinates: Coordinate;
}

/**
 * 电线杆渲染器（Canvas 点层 + VectorLayer 连线层）
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 不包含 MobX 监听（仅保留 hoveredFeature observable）
 * - 通过 Controller 显式调用 addFeatures/removeFeatures/updateFeatureState 更新渲染
 */
export class ElectricPoleRenderer {
  /** 实体图层（Canvas） */
  public readonly entityLayer: VectorLayer;

  /** 连线图层（VectorLayer） */
  public readonly connectionLayer: VectorLayer;

  /** 当前hover的连线feature */
  @observable accessor hoveredFeature: FeatureLike | null = null;

  /** 实体数据源 */
  private readonly entitySource: VectorSource;

  /** 连线数据源 */
  private readonly connectionSource: VectorSource;

  /** Feature 映射：dataInstance.id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  /** 连线映射：`${fromId}-${targetId}` -> Feature */
  private connectionMap: Map<string, Feature> = new Map();

  constructor(config: ElectricPoleRendererConfig) {
    logger.debug('[ElectricPoleRenderer] init', { config });
    this.entitySource = new VectorSource();

    // 生成 Canvas StyleFunction
    const styleFunction = createElectricPoleCanvasStyle({
      iconPath: config.iconPath,
      enableShadow: config.enableShadow,
    });

    // 初始化 Canvas 实体图层
    this.entityLayer = new VectorLayer({
      source: this.entitySource,
      style: styleFunction,
      visible: config.initialVisible ?? true,
      zIndex: Z_INDEX.CREATE_POINT,
    });
    this.entityLayer.set(LayerTypeKey, LayerType.ELECTRIC_POLE);

    // 初始化连线数据源和图层
    this.connectionSource = new VectorSource();
    this.connectionLayer = new VectorLayer({
      source: this.connectionSource,
      style: this.connectionStyleFunction.bind(this),
      renderBuffer: config.renderBuffer ?? 100,
      visible: config.initialVisible ?? true,
      zIndex: Z_INDEX.CONNECTION,
    });
  }

  // #region 公共 API —— 由 Controller 调用

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

  /**
   * 批量添加点 features
   */
  public addFeatures(items: ElectricPoleFeatureData[]): void {
    for (const item of items) {
      this.addSingleFeature(item);
    }
  }

  /**
   * 批量移除点 features 及其关联连线
   */
  public removeFeatures(ids: number[]): void {
    for (const id of ids) {
      const feature = this.featureMap.get(id);
      if (feature) {
        this.entitySource.removeFeature(feature);
        this.featureMap.delete(id);
      }

      // 移除关联连线（fromId 或 targetId 匹配的）
      this.removeConnectionsForInstance(id);
    }
  }

  /**
   * 更新单个 feature 的状态
   */
  public updateFeatureState(id: number, state: ElectricPoleFeatureStateUpdate): void {
    const feature = this.featureMap.get(id);
    if (!feature) return;

    if (state.visible !== undefined) {
      feature.set('visible', state.visible ? 1 : 0, true);
    }
    if (state.active !== undefined) {
      feature.set('active', state.active ? 1 : 0, true);
    }

    feature.changed();
  }

  /**
   * 批量更新所有 features 的状态
   */
  public updateAllFeaturesState(updater: (id: number, feature: Feature) => ElectricPoleFeatureStateUpdate): void {
    for (const [id, feature] of this.featureMap) {
      const state = updater(id, feature);

      if (state.visible !== undefined) {
        feature.set('visible', state.visible ? 1 : 0, true);
      }
      if (state.active !== undefined) {
        feature.set('active', state.active ? 1 : 0, true);
      }
    }

    this.entitySource.changed();
  }

  // #region 连线管理

  /**
   * 添加连线
   */
  public addConnection(data: ConnectionData): void {
    // logger.debug('[ElectricPoleRenderer] addConnection', data);
    const key = `${data.fromInstance.id}-${data.targetId}`;
    if (this.connectionMap.has(key)) return;

    const connectionFeature = new Feature();
    connectionFeature.set(FeatureTypeKey, FeatureType.CONNECTION);
    connectionFeature.set(EntityInstanceKey, data.fromInstance);
    connectionFeature.set(ConnectionTargetIdKey, data.targetId);
    connectionFeature.setGeometry(new LineString([data.fromCoordinates, data.targetCoordinates]));

    this.connectionMap.set(key, connectionFeature);
    this.connectionSource.addFeature(connectionFeature);
  }

  /**
   * 移除连线
   */
  public removeConnection(fromId: number, targetId: number): void {
    const key = `${fromId}-${targetId}`;
    const feature = this.connectionMap.get(key);
    if (feature) {
      if (this.hoveredFeature === feature) {
        this.hoveredFeature = null;
      }
      this.connectionSource.removeFeature(feature);
      this.connectionMap.delete(key);
    }
  }

  /**
   * 移除指定实例的所有连线
   */
  public removeConnectionsForInstance(instanceId: number): void {
    const keysToRemove: string[] = [];
    for (const [key, feature] of this.connectionMap) {
      const [fromId, targetId] = key.split('-').map(Number);
      if (fromId === instanceId || targetId === instanceId) {
        if (this.hoveredFeature === feature) {
          this.hoveredFeature = null;
        }
        this.connectionSource.removeFeature(feature);
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      this.connectionMap.delete(key);
    }
  }

  /**
   * 更新连线坐标（当端点位置变化时）
   */
  public updateConnection(fromId: number, targetId: number, fromCoords: Coordinate, targetCoords: Coordinate): void {
    const key = `${fromId}-${targetId}`;
    const feature = this.connectionMap.get(key);
    if (feature) {
      feature.setGeometry(new LineString([fromCoords, targetCoords]));
    }
  }

  // #endregion

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
   */
  @action
  public setHoveredFeature(feature: FeatureLike | null): void {
    if (this.hoveredFeature === feature) return;
    this.hoveredFeature = feature;
    this.connectionLayer.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    this.featureMap.clear();
    this.connectionMap.clear();
    this.entitySource.clear();
    this.connectionSource.clear();
    this.entityLayer.dispose();
  }

  // #endregion

  // #region 私有方法

  /**
   * 连线样式函数：直接返回预创建的样式常量，避免每帧创建新对象
   */
  private connectionStyleFunction(feature: FeatureLike) {
    return this.hoveredFeature === feature ? CONNECTION_STYLE_HOVER : CONNECTION_STYLE_NORMAL;
  }

  /**
   * 添加单个 feature
   */
  private addSingleFeature(item: ElectricPoleFeatureData): void {
    const feature = new Feature();
    feature.setGeometry(new Point(item.coordinates));
    feature.set(FeatureTypeKey, FeatureType.ENTITY);
    feature.set(EntityInstanceKey, item.dataInstance);

    // 设置属性供 Canvas StyleFunction 读取
    feature.set('visible', item.visible ? 1 : 0);
    feature.set('active', item.active ? 1 : 0);

    this.featureMap.set(item.id, feature);
    this.entitySource.addFeature(feature);
  }

  // #endregion
}
