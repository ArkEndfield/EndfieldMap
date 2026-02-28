import {
  DevToolsFeatureBaseStyleKey,
  type DevToolsFeatureData,
  DevToolsFeatureIdKey,
  DevToolsFeatureTypeKey,
  DevToolsFeatureVisibleKey,
  DevToolsFeatureZIndexKey,
  type DevToolsLayerItem,
  type DevToolsShapeType,
} from '@endfieldmap/map-adapter-ol/types/dev_tools';
import { LayerType, LayerTypeKey } from '@endfieldmap/map-core';
import { Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';

import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';

/**
 * DevTools 渲染器配置
 */
export interface DevToolsRendererConfig {
  /** z-index */
  zIndex?: number;
}

/**
 * DevTools 渲染器
 * 负责渲染开发工具绘制的图形
 */
export class DevToolsRenderer {
  /** 是否是多图层 */
  public readonly isMultiLayer = false;

  /** 图层���例 */
  public readonly layer: VectorLayer;

  /** 数据源 */
  private readonly source: VectorSource;

  /** Feature 映射：id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  constructor(config?: DevToolsRendererConfig) {
    this.source = new VectorSource();

    this.layer = new VectorLayer({
      source: this.source,
      zIndex: config?.zIndex ?? Z_INDEX.DEV_TOOLS,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
    });

    this.layer.set(LayerTypeKey, LayerType.ACTIVE_FEATURE);
    this.layer.set('name', 'devToolsDrawLayer');
  }

  /**
   * 添加 Feature
   */
  public addFeature(data: DevToolsFeatureData): Feature {
    const feature = new Feature({
      geometry: data.geometry,
    });

    feature.set(DevToolsFeatureIdKey, data.id);
    feature.set(DevToolsFeatureTypeKey, data.type);
    feature.set(DevToolsFeatureZIndexKey, data.zIndex);
    feature.set(DevToolsFeatureVisibleKey, data.visible);

    // 设置基础样式并应用 z-index（可见性切换时依赖该样式）
    const baseStyle = data.style;
    feature.set(DevToolsFeatureBaseStyleKey, baseStyle);
    if (Array.isArray(baseStyle)) {
      baseStyle.forEach((s) => s.setZIndex?.(data.zIndex));
    } else if (baseStyle && typeof baseStyle === 'object' && 'setZIndex' in baseStyle) {
      (baseStyle as Style).setZIndex(data.zIndex);
    }

    if (data.visible) {
      feature.setStyle(baseStyle);
    } else {
      feature.setStyle([]);
    }

    this.featureMap.set(data.id, feature);
    this.source.addFeature(feature);

    return feature;
  }

  /**
   * 移除 Feature
   */
  public removeFeature(id: number): boolean {
    const feature = this.featureMap.get(id);
    if (!feature) {
      return false;
    }

    this.source.removeFeature(feature);
    this.featureMap.delete(id);
    return true;
  }

  /**
   * 获取 Feature
   */
  public getFeature(id: number): Feature | undefined {
    return this.featureMap.get(id);
  }

  /**
   * 获取所有 Feature
   */
  public getAllFeatures(): Feature[] {
    return Array.from(this.featureMap.values());
  }

  /**
   * 获取所有 Feature 数据
   */
  public getAllFeatureData(): DevToolsFeatureData[] {
    return this.getAllFeatures().map((feature) => ({
      id: feature.get(DevToolsFeatureIdKey) as number,
      type: feature.get(DevToolsFeatureTypeKey) as DevToolsShapeType,
      geometry: feature.getGeometry() as Geometry,
      style: (feature.get(DevToolsFeatureBaseStyleKey) as Style | Style[]) ?? (feature.getStyle() as Style | Style[]),
      zIndex: feature.get(DevToolsFeatureZIndexKey) as number,
      visible: (feature.get(DevToolsFeatureVisibleKey) as boolean) ?? true,
    }));
  }

  public getAllLayerItems(): DevToolsLayerItem[] {
    return this.getAllFeatures().map((feature) => ({
      id: feature.get(DevToolsFeatureIdKey) as number,
      type: feature.get(DevToolsFeatureTypeKey) as DevToolsShapeType,
      zIndex: feature.get(DevToolsFeatureZIndexKey) as number,
      visible: (feature.get(DevToolsFeatureVisibleKey) as boolean) ?? true,
    }));
  }

  /**
   * 获取 Feature 数量
   */
  public getFeatureCount(): number {
    return this.featureMap.size;
  }

  /**
   * 清空所有 Feature
   */
  public clear(): void {
    this.source.clear();
    this.featureMap.clear();
  }

  /**
   * 批量同步 Features（用于撤销/重做）
   */
  public syncFeatures(features: DevToolsFeatureData[]): void {
    this.clear();
    for (const data of features) {
      this.addFeature(data);
    }
  }

  public setFeatureVisible(id: number, visible: boolean): boolean {
    const feature = this.featureMap.get(id);
    if (!feature) {
      return false;
    }

    const current = (feature.get(DevToolsFeatureVisibleKey) as boolean) ?? true;
    if (current === visible) {
      return true;
    }

    feature.set(DevToolsFeatureVisibleKey, visible);

    if (visible) {
      const baseStyle = feature.get(DevToolsFeatureBaseStyleKey) as Style | Style[] | undefined;
      feature.setStyle(baseStyle);
    } else {
      feature.setStyle([]);
    }

    this.refresh();
    return true;
  }

  public getFeatureVisible(id: number): boolean {
    const feature = this.featureMap.get(id);
    if (!feature) {
      return false;
    }
    return (feature.get(DevToolsFeatureVisibleKey) as boolean) ?? true;
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
    this.clear();
  }
}
