import type { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import {
  EntityGroupRenderer,
  type EntityGroupRendererConfig,
} from '@endfieldmap/map-core/render/renderer/entity/common/entity_group_renderer';
import type { MapData } from '@endfieldmap/map-core/types';
import type { Layer } from 'ol/layer';

export interface EntityRenderConfig {
  mapInstance: EndfieldMap;
  mapIds: MapData['id'][];
}

/**
 * Entity 渲染管理器
 * 管理所有地图上所有 Entity 组的 EntityGroupRenderer 实例
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 由 Controller 调用其方法来创建渲染器、切换地图、更新状态
 */
export class EntityRender {
  /** mapId -> entityDataIdKey -> EntityGroupRenderer */
  public renders: Map<MapData['id'], Map<string, EntityGroupRenderer>>;

  private mapInstance: EndfieldMap;

  /** 当前已添加到地图的图层（包括 WebGL 主图层和 Canvas badge 图层） */
  private currentLayers: Layer[] = [];

  constructor(config: EntityRenderConfig) {
    this.mapInstance = config.mapInstance;
    this.renders = new Map();
    for (const mapId of config.mapIds) {
      this.renders.set(mapId, new Map());
    }
  }

  /**
   * 为指定地图创建一个组渲染器
   * @returns 创建的渲染器实例
   */
  public createGroupRenderer(
    mapId: MapData['id'],
    entityDataIdKey: string,
    config: EntityGroupRendererConfig
  ): EntityGroupRenderer {
    const mapRenderers = this.renders.get(mapId);
    if (!mapRenderers) {
      throw new Error(`[EntityRender] Map not found: ${mapId}`);
    }

    const renderer = new EntityGroupRenderer(config);
    mapRenderers.set(entityDataIdKey, renderer);
    return renderer;
  }

  /**
   * 获取指定地图的所有渲染器
   */
  public getRenderers(mapId: MapData['id']): EntityGroupRenderer[] {
    const mapRenderers = this.renders.get(mapId);
    return mapRenderers ? Array.from(mapRenderers.values()) : [];
  }

  /**
   * 切换到指定地图
   * 清除旧图层，添加新地图的图层（包括 WebGL 主图层和 Canvas badge 图层）
   */
  public switchMap(mapId: MapData['id']): void {
    // 清除旧图层
    this.clearLayer();

    // 添加新地图的图层
    const mapRenderers = this.renders.get(mapId);
    if (mapRenderers) {
      for (const renderer of mapRenderers.values()) {
        // 添加 WebGL 主图层
        this.mapInstance.map.addLayer(renderer.layer);
        this.currentLayers.push(renderer.layer);
        // 添加 Canvas badge 图层
        this.mapInstance.map.addLayer(renderer.badgeLayer);
        this.currentLayers.push(renderer.badgeLayer);
      }
    }
  }

  /** 清除当前图层 */
  public clearLayer(): void {
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];
  }

  /**
   * 设置当前地图渲染器的聚合距离
   */
  public setClusterDistance(mapId: MapData['id'], distance: number): void {
    const mapRenderers = this.renders.get(mapId);
    if (mapRenderers) {
      for (const renderer of mapRenderers.values()) {
        renderer.setClusterDistance(distance);
      }
    }
  }

  /**
   * 设置指定组的可见性
   */
  public setGroupVisible(mapId: MapData['id'], entityDataIdKey: string, visible: boolean): void {
    const mapRenderers = this.renders.get(mapId);
    const renderer = mapRenderers?.get(entityDataIdKey);
    if (renderer) {
      renderer.setVisible(visible);
    }
  }

  /**
   * 更新指定 feature 的状态
   * 遍历指定地图的所有渲染器查找匹配的 feature
   */
  public updateFeatureState(
    mapId: MapData['id'],
    featureId: number,
    state: { visible?: boolean; marked?: boolean; selected?: boolean; active?: boolean }
  ): void {
    const mapRenderers = this.renders.get(mapId);
    if (mapRenderers) {
      for (const renderer of mapRenderers.values()) {
        renderer.updateFeatureState(featureId, state);
      }
    }
  }

  /**
   * 获取当前显示的渲染器列表（用于 hit test）
   */
  public get currentRenderer(): EntityGroupRenderer[] {
    // 从 currentLayers 中找对应的渲染器（注意 currentLayers 现在包含 WebGL 和 Canvas 两种图层）
    const renderers: EntityGroupRenderer[] = [];
    for (const [, mapRenderers] of this.renders) {
      for (const renderer of mapRenderers.values()) {
        // 检查 WebGL 主图层是否在 currentLayers 中
        if (this.currentLayers.includes(renderer.layer)) {
          renderers.push(renderer);
        }
      }
    }
    return renderers;
  }

  /**
   * 获取所有渲染器
   */
  public get allRenderers(): EntityGroupRenderer[] {
    const renderers: EntityGroupRenderer[] = [];
    for (const [, mapRenderers] of this.renders) {
      for (const renderer of mapRenderers.values()) {
        renderers.push(renderer);
      }
    }
    return renderers;
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
      mapRenderers.clear();
    }
    this.renders.clear();
  }
}
