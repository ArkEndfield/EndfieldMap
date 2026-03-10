import {
  CONNECTION_STYLE_HOVER,
  CONNECTION_STYLE_NORMAL,
  CONNECTION_STYLE_POLE_HOVER,
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

/** 添加连线选项 */
export interface AddConnectionOptions {
  /** 是否从起点到终点做伸展动画 */
  animate?: boolean;
}

/** 移除连线选项 */
export interface RemoveConnectionOptions {
  /** 是否先收缩到起点再移除 */
  animate?: boolean;
}

/** 移除 features 选项（含关联连线） */
export interface RemoveFeaturesOptions {
  /** 移除关联连线时是否先做收缩动画 */
  animateConnections?: boolean;
}

/** 连线动画时长（毫秒） */
const CONNECTION_ANIMATION_DURATION_MS = 280;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
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

  /** 当前 hover 的连线 feature */
  @observable accessor hoveredFeature: FeatureLike | null = null;

  /** 当前 hover 的电线杆 id（用于高亮该杆的所有连线与 zone） */
  @observable accessor hoveredPoleId: number | null = null;

  /** 实体数据源 */
  private readonly entitySource: VectorSource;

  /** 连线数据源 */
  private readonly connectionSource: VectorSource;

  /** Feature 映射：dataInstance.id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  /** 连线映射：`${fromId}-${targetId}` -> Feature */
  private connectionMap: Map<string, Feature> = new Map();

  /** 正在做伸展动画的连线：key -> 动画开始时间戳 */
  private expandingConnections: Map<string, number> = new Map();

  /** 正在做收缩动画的连线：key -> { startTime, fromCoords, targetCoords }，动画结束后移除 */
  private shrinkingConnections: Map<
    string,
    { startTime: number; fromCoords: Coordinate; targetCoords: Coordinate }
  > = new Map();

  /** 连线动画 RAF id */
  private connectionAnimationRafId: number | null = null;

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
   * @param options.animateConnections 为 true 时，关联连线先收缩再移除
   */
  public removeFeatures(ids: number[], options?: RemoveFeaturesOptions): void {
    for (const id of ids) {
      const feature = this.featureMap.get(id);
      if (feature) {
        this.entitySource.removeFeature(feature);
        this.featureMap.delete(id);
      }
      this.removeConnectionsForInstance(id, {
        animate: options?.animateConnections === true,
      });
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
   * @param options.animate 为 true 时，连线从起点伸展到终点
   */
  public addConnection(data: ConnectionData, options?: AddConnectionOptions): void {
    const key = `${data.fromInstance.id}-${data.targetId}`;
    if (this.connectionMap.has(key)) return;

    const animate = options?.animate === true;
    const from = data.fromCoordinates;
    const to = data.targetCoordinates;

    const connectionFeature = new Feature();
    connectionFeature.set(FeatureTypeKey, FeatureType.CONNECTION);
    connectionFeature.set(EntityInstanceKey, data.fromInstance);
    connectionFeature.set(ConnectionTargetIdKey, data.targetId);
    connectionFeature.set('fromCoordinates', from);
    connectionFeature.set('targetCoordinates', to);
    connectionFeature.setGeometry(
      animate ? new LineString([from.slice() as [number, number], from.slice() as [number, number]]) : new LineString([from, to])
    );

    this.connectionMap.set(key, connectionFeature);
    this.connectionSource.addFeature(connectionFeature);

    if (animate) {
      this.expandingConnections.set(key, performance.now());
      this.startConnectionAnimationLoop();
    }
  }

  /**
   * 移除连线
   * @param options.animate 为 true 时，连线先收缩到起点再移除
   */
  public removeConnection(fromId: number, targetId: number, options?: RemoveConnectionOptions): void {
    const key = `${fromId}-${targetId}`;
    const feature = this.connectionMap.get(key);
    if (!feature) return;

    if (this.hoveredFeature === feature) {
      this.hoveredFeature = null;
    }
    this.expandingConnections.delete(key);

    if (options?.animate === true) {
      const geom = feature.getGeometry() as LineString | undefined;
      if (geom) {
        const flat = geom.getFlatCoordinates();
        if (flat.length >= 4) {
          const fromCoords: Coordinate = [flat[0], flat[1]];
          const targetCoords: Coordinate = [flat[flat.length - 2], flat[flat.length - 1]];
          this.shrinkingConnections.set(key, {
            startTime: performance.now(),
            fromCoords,
            targetCoords,
          });
          this.startConnectionAnimationLoop();
          return;
        }
      }
    }

    this.connectionSource.removeFeature(feature);
    this.connectionMap.delete(key);
  }

  /**
   * 移除指定实例的所有连线
   * @param options.animate 为 true 时，每条连线先收缩再移除
   */
  public removeConnectionsForInstance(instanceId: number, options?: RemoveConnectionOptions): void {
    const keysToProcess: string[] = [];
    for (const [key] of this.connectionMap) {
      const [fromId, targetId] = key.split('-').map(Number);
      if (fromId === instanceId || targetId === instanceId) {
        keysToProcess.push(key);
      }
    }
    for (const key of keysToProcess) {
      const [fromId, targetId] = key.split('-').map(Number);
      this.removeConnection(fromId, targetId, options);
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
   * 设置 hover 的连线 feature
   */
  @action
  public setHoveredFeature(feature: FeatureLike | null): void {
    if (this.hoveredFeature === feature) return;
    this.hoveredFeature = feature;
    this.connectionLayer.changed();
  }

  /**
   * 设置当前 hover 的电线杆 id（高亮该杆关联的连线与 zone，由上层在 ENTITY_HOVER 为电线杆时调用）
   */
  @action
  public setHoveredPoleId(poleId: number | null): void {
    if (this.hoveredPoleId === poleId) return;
    this.hoveredPoleId = poleId;
    this.connectionLayer.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    if (this.connectionAnimationRafId != null) {
      cancelAnimationFrame(this.connectionAnimationRafId);
      this.connectionAnimationRafId = null;
    }
    this.expandingConnections.clear();
    this.shrinkingConnections.clear();
    this.featureMap.clear();
    this.connectionMap.clear();
    this.entitySource.clear();
    this.connectionSource.clear();
    this.entityLayer.dispose();
  }

  // #endregion

  // #region 私有方法

  /**
   * 连线样式函数：悬停连线用 HOVER；与悬停电线杆相关的连线用 POLE_HOVER（0.8 不透明度）；其余用 NORMAL
   */
  private connectionStyleFunction(feature: FeatureLike) {
    if (this.hoveredFeature === feature) return CONNECTION_STYLE_HOVER;
    const poleId = this.hoveredPoleId;
    if (poleId != null) {
      const fromInstance = feature.get(EntityInstanceKey) as { id: number } | undefined;
      const targetId = feature.get(ConnectionTargetIdKey) as number | undefined;
      if (fromInstance?.id === poleId || targetId === poleId) return CONNECTION_STYLE_POLE_HOVER;
    }
    return CONNECTION_STYLE_NORMAL;
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

  private startConnectionAnimationLoop(): void {
    if (this.connectionAnimationRafId != null) return;

    const tick = (): void => {
      this.connectionAnimationRafId = null;
      const now = performance.now();
      let hasUpdates = false;
      const keysToRemove: string[] = [];

      // 伸展：起点 -> 终点
      for (const [key, startTime] of this.expandingConnections) {
        const feature = this.connectionMap.get(key);
        if (!feature) {
          this.expandingConnections.delete(key);
          continue;
        }
        const from = feature.get('fromCoordinates') as Coordinate;
        const to = feature.get('targetCoordinates') as Coordinate;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / CONNECTION_ANIMATION_DURATION_MS);
        const t = easeOutCubic(progress);
        const x = from[0] + (to[0] - from[0]) * t;
        const y = from[1] + (to[1] - from[1]) * t;
        feature.setGeometry(new LineString([from, [x, y]]));
        hasUpdates = true;
        if (progress >= 1) {
          feature.setGeometry(new LineString([from, to]));
          this.expandingConnections.delete(key);
        }
      }

      // 收缩：终点 -> 起点，结束后移除
      for (const [key, state] of this.shrinkingConnections) {
        const feature = this.connectionMap.get(key);
        if (!feature) {
          this.shrinkingConnections.delete(key);
          continue;
        }
        const elapsed = now - state.startTime;
        const progress = Math.min(1, elapsed / CONNECTION_ANIMATION_DURATION_MS);
        const t = easeOutCubic(progress);
        const x = state.targetCoords[0] + (state.fromCoords[0] - state.targetCoords[0]) * t;
        const y = state.targetCoords[1] + (state.fromCoords[1] - state.targetCoords[1]) * t;
        feature.setGeometry(new LineString([state.fromCoords, [x, y]]));
        hasUpdates = true;
        if (progress >= 1) {
          keysToRemove.push(key);
          this.shrinkingConnections.delete(key);
        }
      }

      for (const key of keysToRemove) {
        const feature = this.connectionMap.get(key);
        if (feature) {
          this.connectionSource.removeFeature(feature);
          this.connectionMap.delete(key);
        }
      }

      if (hasUpdates || keysToRemove.length > 0) {
        this.connectionLayer.changed();
      }
      if (this.expandingConnections.size > 0 || this.shrinkingConnections.size > 0) {
        this.connectionAnimationRafId = requestAnimationFrame(tick);
      }
    };

    this.connectionAnimationRafId = requestAnimationFrame(tick);
  }

  // #endregion
}
