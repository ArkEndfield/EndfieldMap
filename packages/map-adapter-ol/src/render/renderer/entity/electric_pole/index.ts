import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { ElectricPoleRenderer } from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole/electric_pole_renderer';
import { ElectricPoleZoneRenderer } from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole/electric_pole_zone_renderer';
import type { MapData } from '@endfieldmap/map-core';
import type VectorLayer from 'ol/layer/Vector';
import type WebGLVectorLayer from 'ol/layer/WebGLVector';

export interface ElectricPoleRenderConfig {
  mapInstance: EndfieldMap;
  mapIds: MapData['id'][];
  entityImagePath: string;
}

/**
 * 每个地图每种设备类型的渲染实例
 */
interface DeviceRenderers {
  pole: ElectricPoleRenderer;
  zone: ElectricPoleZoneRenderer;
}

/**
 * 电线杆渲染管理器
 * 管理所有地图的电线杆渲染器（按 deviceKey 分组）
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 通过 Controller 显式创建渲染器和管理图层
 */
export class ElectricPoleRender {
  /** 每个地图每种设备类型的渲染器：mapId -> (deviceKey -> DeviceRenderers) */
  private renders: Map<MapData['id'], Map<string, DeviceRenderers>> = new Map();

  /** 当前显示的图层 */
  private currentLayers: (WebGLVectorLayer | VectorLayer)[] = [];

  /** 地图实例 */
  private mapInstance: EndfieldMap;

  constructor(config: ElectricPoleRenderConfig) {
    this.mapInstance = config.mapInstance;

    // 为每个地图初始化空的渲染器 map
    for (const mapId of config.mapIds) {
      this.renders.set(mapId, new Map());
    }
  }

  /**
   * 为指定地图创建指定设备类型的渲染器
   */
  public createRenderer(
    mapId: MapData['id'],
    deviceKey: string,
    config: { iconPath: string; initialVisible?: boolean; zoneVisible?: boolean }
  ): DeviceRenderers {
    let mapRenderers = this.renders.get(mapId);
    if (!mapRenderers) {
      mapRenderers = new Map();
      this.renders.set(mapId, mapRenderers);
    }

    // 如果已存在，先销毁
    const existing = mapRenderers.get(deviceKey);
    if (existing) {
      existing.pole.dispose();
      existing.zone.dispose();
    }

    const pole = new ElectricPoleRenderer({
      iconPath: config.iconPath,
      initialVisible: config.initialVisible,
    });

    const zone = new ElectricPoleZoneRenderer(config.zoneVisible);

    const renderers: DeviceRenderers = { pole, zone };
    mapRenderers.set(deviceKey, renderers);

    return renderers;
  }

  /**
   * 获取指定地图指定设备类型的渲染器
   */
  public getRenderer(mapId: MapData['id'], deviceKey: string): DeviceRenderers | undefined {
    return this.renders.get(mapId)?.get(deviceKey);
  }

  /**
   * 获取指定地图的所有渲染器
   */
  public getRenderers(mapId: MapData['id']): DeviceRenderers[] {
    const mapRenderers = this.renders.get(mapId);
    if (!mapRenderers) return [];
    return Array.from(mapRenderers.values());
  }

  /**
   * 获取指定地图的所有 pole 渲染器
   */
  public getPoleRenderers(mapId: MapData['id']): ElectricPoleRenderer[] {
    return this.getRenderers(mapId).map((r) => r.pole);
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
      for (const renderers of mapRenderers.values()) {
        this.mapInstance.map.addLayer(renderers.pole.entityLayer);
        this.mapInstance.map.addLayer(renderers.pole.connectionLayer);
        this.mapInstance.map.addLayer(renderers.zone.layer);

        this.currentLayers.push(renderers.pole.entityLayer);
        this.currentLayers.push(renderers.pole.connectionLayer);
        this.currentLayers.push(renderers.zone.layer);
      }
    }
  }

  /**
   * 获取当前显示的 pole + zone 实例
   */
  public get currentElectricPoleInstance(): {
    pole: ElectricPoleRenderer | null;
    zone: ElectricPoleZoneRenderer | null;
  } {
    // 返回第一个找到的（向后兼容）
    for (const [, mapRenderers] of this.renders) {
      for (const renderers of mapRenderers.values()) {
        if (this.currentLayers.includes(renderers.pole.entityLayer)) {
          return { pole: renderers.pole, zone: renderers.zone };
        }
      }
    }
    return { pole: null, zone: null };
  }

  /**
   * 获取当前所有显示的 pole 渲染器
   */
  public get currentPoleRenderers(): ElectricPoleRenderer[] {
    const result: ElectricPoleRenderer[] = [];
    for (const [, mapRenderers] of this.renders) {
      for (const renderers of mapRenderers.values()) {
        if (this.currentLayers.includes(renderers.pole.entityLayer)) {
          result.push(renderers.pole);
        }
      }
    }
    return result;
  }

  /**
   * 设置所有渲染器可见性
   */
  public setVisible(visible: boolean): void {
    for (const [, mapRenderers] of this.renders) {
      for (const renderers of mapRenderers.values()) {
        renderers.pole.setVisible(visible);
      }
    }
  }

  /**
   * 设置 zone 可见性
   */
  public setZoneVisible(visible: boolean): void {
    for (const [, mapRenderers] of this.renders) {
      for (const renderers of mapRenderers.values()) {
        renderers.zone.setVisible(visible);
      }
    }
  }

  /**
   * 设置指定设备类型的可见性
   */
  public setDeviceVisible(mapId: MapData['id'], deviceKey: string, visible: boolean): void {
    const renderer = this.renders.get(mapId)?.get(deviceKey);
    if (renderer) {
      renderer.pole.setVisible(visible);
      renderer.zone.setVisible(visible);
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
      for (const renderers of mapRenderers.values()) {
        renderers.pole.dispose();
        renderers.zone.dispose();
      }
    }
    this.renders.clear();
  }
}
