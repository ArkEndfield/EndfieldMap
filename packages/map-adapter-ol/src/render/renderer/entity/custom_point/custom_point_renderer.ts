import type { CustomPointDataInstance } from '@endfieldmap/map-core';
import {
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  LayerType,
  LayerTypeKey,
} from '@endfieldmap/map-core';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Point } from 'ol/geom';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import VectorSource from 'ol/source/Vector';

import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';

import { createCustomPointWebGLStyle } from '@endfieldmap/map-adapter-ol/render/renderer/entity/custom_point/custom_point_style';

/**
 * 自定义标点渲染器配置
 */
export interface CustomPointRendererConfig {
  /** 图标路径 */
  iconPath: string;
  /** 渲染缓冲区 */
  renderBuffer?: number;
  /** 初始可见性 */
  initialVisible?: boolean;
}

/**
 * 添加 Feature 所需的数据
 */
export interface CustomPointFeatureData {
  /** 数据实例ID */
  id: number;
  /** 坐标 */
  coordinates: Coordinate;
  /** 数据实例引用（供 hit test 使用） */
  dataInstance: CustomPointDataInstance;
  /** 是否可见 */
  visible: boolean;
  /** 是否激活 */
  active: boolean;
}

/**
 * Feature 状态更新
 */
export interface CustomPointFeatureStateUpdate {
  visible?: boolean;
  active?: boolean;
}

/**
 * 自定义标点渲染器（WebGL）
 * 负责渲染单个类型的自定义标点
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 不包含 MobX 监听
 * - 通过 Controller 显式调用 addFeatures/removeFeatures/updateFeatureState 更新渲染
 */
export class CustomPointRenderer {
  /** 图层实例 */
  public readonly layer: WebGLVectorLayer;

  /** 数据源 */
  private readonly source: VectorSource;

  /** Feature 映射：dataInstance.id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  constructor(config: CustomPointRendererConfig) {
    // 初始化数据源
    this.source = new VectorSource();

    // 生成 WebGL FlatStyle
    const flatStyles = createCustomPointWebGLStyle({
      iconPath: config.iconPath,
    });

    // 初始化 WebGL 图层
    this.layer = new WebGLVectorLayer({
      source: this.source,
      style: flatStyles,
      visible: config.initialVisible ?? true,
      zIndex: Z_INDEX.CREATE_POINT,
      disableHitDetection: false,
    });
    this.layer.set(LayerTypeKey, LayerType.CUSTOM_POINT);
  }

  // #region 公共 API —— 由 Controller 调用

  /**
   * 批量添加 features
   */
  public addFeatures(items: CustomPointFeatureData[]): void {
    for (const item of items) {
      this.addSingleFeature(item);
    }
  }

  /**
   * 批量移除 features
   */
  public removeFeatures(ids: number[]): void {
    for (const id of ids) {
      const feature = this.featureMap.get(id);
      if (feature) {
        this.source.removeFeature(feature);
        this.featureMap.delete(id);
      }
    }
  }

  /**
   * 更新单个 feature 的状态
   */
  public updateFeatureState(id: number, state: CustomPointFeatureStateUpdate): void {
    const feature = this.featureMap.get(id);
    if (!feature) return;

    let needGeometryUpdate = false;

    if (state.visible !== undefined) {
      feature.set('visible', state.visible ? 1 : 0, true);
      needGeometryUpdate = true;
    }
    if (state.active !== undefined) {
      feature.set('active', state.active ? 1 : 0, true);
    }

    feature.changed();

    if (needGeometryUpdate) {
      // visible 变化影响 geometryFunction 输出
      this.source.changed();
    }
  }

  /**
   * 批量更新所有 features 的状态
   */
  public updateAllFeaturesState(updater: (id: number, feature: Feature) => CustomPointFeatureStateUpdate): void {
    for (const [id, feature] of this.featureMap) {
      const state = updater(id, feature);

      if (state.visible !== undefined) {
        feature.set('visible', state.visible ? 1 : 0, true);
      }
      if (state.active !== undefined) {
        feature.set('active', state.active ? 1 : 0, true);
      }
    }

    this.source.changed();
  }

  /**
   * 设置图层可见性（组级别）
   */
  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
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
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
    this.source.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    this.featureMap.clear();
    this.source.clear();
    try {
      this.layer.dispose();
    } catch {
      // WebGL context may already be lost or layer never rendered
    }
  }

  // #endregion

  // #region 私有方法

  /**
   * 添加单个 feature
   */
  private addSingleFeature(item: CustomPointFeatureData): void {
    const feature = new Feature();
    feature.setGeometry(new Point(item.coordinates));
    feature.set(FeatureTypeKey, FeatureType.ENTITY);
    feature.set(EntityInstanceKey, item.dataInstance);

    // 设置属性供 WebGL 表达式读取
    feature.set('visible', item.visible ? 1 : 0);
    feature.set('active', item.active ? 1 : 0);

    this.featureMap.set(item.id, feature);
    this.source.addFeature(feature);
  }

  // #endregion
}
