import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { CustomPointRenderer } from '@endfieldmap/map-adapter-ol/render/renderer/entity/custom_point/custom_point_renderer';
import type { MapData } from '@endfieldmap/map-core';
import type VectorLayer from 'ol/layer/Vector';

export interface CustomPointRenderConfig {
  mapInstance: EndfieldMap;
  mapIds: MapData['id'][];
  asset: { entityImage: string };
}

/**
 * 自定义标点渲染管理器
 * 管理所有地图的自定义标点渲染器
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 通过 Controller 显式创建渲染器和管理图层
 */
export class CustomPointRender {
  /** 每个地图每种类型的渲染器：mapId -> (typeId -> CustomPointRenderer) */
  private renders: Map<MapData['id'], Map<string, CustomPointRenderer>> = new Map();

  /** 当前显示的图层 */
  private currentLayers: VectorLayer[] = [];

  /** 地图实例 */
  private mapInstance: EndfieldMap;

  /** 资源路径 */
  private asset: { entityImage: string };

  constructor(config: CustomPointRenderConfig) {
    this.mapInstance = config.mapInstance;
    this.asset = config.asset;

    // 为每个地图初始化空的渲染器 map
    for (const mapId of config.mapIds) {
      this.renders.set(mapId, new Map());
    }
  }

  /**
   * 为指定地图创建指定类型的渲染器
   */
  public createRenderer(
    mapId: MapData['id'],
    typeId: string,
    config: { iconPath: string; initialVisible?: boolean }
  ): CustomPointRenderer {
    let mapRenderers = this.renders.get(mapId);
    if (!mapRenderers) {
      mapRenderers = new Map();
      this.renders.set(mapId, mapRenderers);
    }

    // 如果已存在，先销毁
    const existing = mapRenderers.get(typeId);
    if (existing) {
      existing.dispose();
    }

    const renderer = new CustomPointRenderer({
      iconPath: config.iconPath,
      initialVisible: config.initialVisible,
    });

    mapRenderers.set(typeId, renderer);
    return renderer;
  }

  /**
   * 获取指定地图指定类型的渲染器
   */
  public getRenderer(mapId: MapData['id'], typeId: string): CustomPointRenderer | undefined {
    return this.renders.get(mapId)?.get(typeId);
  }

  /**
   * 获取指定地图的所有渲染器
   */
  public getRenderers(mapId: MapData['id']): CustomPointRenderer[] {
    const mapRenderers = this.renders.get(mapId);
    if (!mapRenderers) return [];
    return Array.from(mapRenderers.values());
  }

  /**
   * 切换地图：移除旧图层，添加新图层
   */
  public switchMap(mapId: MapData['id']): void {
    // 移除旧图层
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];

    // 添加新图层
    const mapRenderers = this.renders.get(mapId);
    if (mapRenderers) {
      for (const renderer of mapRenderers.values()) {
        this.mapInstance.map.addLayer(renderer.layer);
        this.currentLayers.push(renderer.layer);
      }
    }
  }

  /**
   * 获取当前显示的渲染器列表（用于 hit test）
   */
  public get currentRenderer(): CustomPointRenderer[] {
    const renderers: CustomPointRenderer[] = [];
    for (const [, mapRenderers] of this.renders) {
      for (const renderer of mapRenderers.values()) {
        if (this.currentLayers.includes(renderer.layer)) {
          renderers.push(renderer);
        }
      }
    }
    return renderers;
  }

  /**
   * 获取资源路径
   */
  public get entityImagePath(): string {
    return this.asset.entityImage;
  }

  /**
   * 设置指定地图所有渲染器的可见性
   */
  public setGroupVisible(mapId: MapData['id'], typeId: string, visible: boolean): void {
    const renderer = this.renders.get(mapId)?.get(typeId);
    if (renderer) {
      renderer.setVisible(visible);
    }
  }

  /**
   * 更新指定地图指定 feature 的状态
   */
  public updateFeatureState(
    mapId: MapData['id'],
    featureId: number,
    state: { visible?: boolean; active?: boolean }
  ): void {
    const mapRenderers = this.renders.get(mapId);
    if (mapRenderers) {
      for (const renderer of mapRenderers.values()) {
        renderer.updateFeatureState(featureId, state);
      }
    }
  }

  /**
   * 清除所有图层
   */
  public clearLayer(): void {
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];
  }

  /**
   * 销毁所有渲染器
   */
  public dispose(): void {
    this.clearLayer();
    for (const [, mapRenderers] of this.renders) {
      for (const renderer of mapRenderers.values()) {
        renderer.dispose();
      }
    }
    this.renders.clear();
  }
}
