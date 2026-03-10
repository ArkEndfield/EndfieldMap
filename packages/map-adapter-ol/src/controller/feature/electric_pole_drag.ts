import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { ElectricPoleController } from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import type { ElectricPoleDataInstance, EndfieldMapEmitter, MapCoordinate, MapData } from '@endfieldmap/map-core';
import { MAP_EVENT } from '@endfieldmap/map-core';
import type { DisposeListener } from '@endfieldmap/map-core';
import type { HoverFeatureController } from '@endfieldmap/map-adapter-ol/controller/feature/hover_feature';
import Collection from 'ol/Collection.js';
import type { Feature } from 'ol';
import type { Point } from 'ol/geom';
import Translate from 'ol/interaction/Translate';

export interface ElectricPoleDragControllerConfig {
  mapInstance: EndfieldMap;
  electricPoleController: ElectricPoleController;
  getCurrentMapId: () => MapData['id'];
  hoverFeatureController: HoverFeatureController;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

export interface InitPoleDragOptions {
  canDragPole: () => boolean;
  /** 可返回 Promise，adapter 会等待完成后再清空拖拽状态，失败时保留状态供 revertPoleDrag 回退 */
  onEnd: (instance: ElectricPoleDataInstance, newCoordinate: MapCoordinate) => void | Promise<void>;
}

/**
 * 电线杆拖拽控制器
 * pointerdown 时若 hover 目标为电线杆且 canDragPole，则加入 Translate 拖拽；translateend 时调用 onEnd 并标记 lastDraggedPole 以抑制一次 ENTITY_CLICK。
 */
export class ElectricPoleDragController {
  private mapInstance: EndfieldMap;
  private electricPoleController: ElectricPoleController;
  private getCurrentMapId: () => MapData['id'];
  private hoverFeatureController: HoverFeatureController;
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;
  private disposePointerdown: DisposeListener | null = null;

  private canDragPole: () => boolean = () => false;
  private onEnd: (instance: ElectricPoleDataInstance, newCoordinate: MapCoordinate) => void | Promise<void> =
    () => {};

  private translate: Translate | null = null;
  private translateEndHandler: (() => void) | null = null;
  private dragInstance: ElectricPoleDataInstance | null = null;
  private dragFeature: Feature<Point> | null = null;
  private oldCoord: MapCoordinate | null = null;

  /** 拖拽结束后用于抑制一次 ENTITY_CLICK 的实例 */
  private lastDraggedPoleInstance: ElectricPoleDataInstance | null = null;

  constructor(config: ElectricPoleDragControllerConfig) {
    this.mapInstance = config.mapInstance;
    this.electricPoleController = config.electricPoleController;
    this.getCurrentMapId = config.getCurrentMapId;
    this.hoverFeatureController = config.hoverFeatureController;
    this.emitter = config.emitter;
  }

  public initPoleDrag(options: InitPoleDragOptions): void {
    this.canDragPole = options.canDragPole;
    this.onEnd = options.onEnd;
    if (this.disposePointerdown) return;
    this.disposePointerdown = this.emitter.on(
      MAP_EVENT.MAP_POINTERDOWN,
      (event: OLMapEventPayloads['map:pointerdown']) => {
        this.handlePointerdown(event);
      }
    );
  }

  /** 是否正在拖拽电线杆（Translate 未移除前为 true） */
  public isPoleDragging(): boolean {
    return this.translate !== null;
  }

  public getLastDraggedPoleInstance(): ElectricPoleDataInstance | null {
    return this.lastDraggedPoleInstance;
  }

  public clearLastDraggedPoleInstance(): void {
    this.lastDraggedPoleInstance = null;
  }

  public disablePoleDrag(): void {
    this.removeTranslate();
  }

  public revertPoleDrag(): void {
    const instance = this.dragInstance;
    const feature = this.dragFeature;
    const old = this.oldCoord;
    this.dragInstance = null;
    this.dragFeature = null;
    this.oldCoord = null;
    this.removeTranslate();
    if (feature && old) {
      const geom = feature.getGeometry();
      if (geom) {
        geom.setCoordinates(old as [number, number]);
        feature.changed();
      }
    }
    // 同步回退 controller 的 instance 与渲染，避免数据层仍为新坐标导致再次覆盖
    if (instance && old) {
      try {
        this.electricPoleController.updateElectricPolePosition(instance.mapId, instance.id, old);
      } catch {
        // 回退位置理论上应通过校验，忽略
      }
    }
  }

  public dispose(): void {
    this.disposePointerdown?.();
    this.disposePointerdown = null;
    this.removeTranslate();
    this.canDragPole = () => false;
    this.onEnd = () => {};
  }

  private handlePointerdown(_event: OLMapEventPayloads['map:pointerdown']): void {
    if (this.translate) return;

    const hovered = this.hoverFeatureController.hoverFeature;
    if (!hovered || hovered.entityType !== '#ElectricPole') return;
    const instance = hovered as ElectricPoleDataInstance;
    if (!this.canDragPole()) return;

    const currentMapId = this.getCurrentMapId();
    if (instance.mapId !== currentMapId) return;

    const renderers = this.electricPoleController.render.getRenderer(instance.mapId, instance.deviceKey);
    if (!renderers) return;

    const feature = renderers.pole.getFeature(instance.id);
    if (!feature) return;

    const geometry = feature.getGeometry() as Point | undefined;
    if (!geometry) return;

    this.oldCoord = geometry.getCoordinates() as MapCoordinate;
    this.dragInstance = instance;
    this.dragFeature = feature as Feature<Point>;

    // 拖拽期间清除 hover，避免指示器停在原处不跟随
    this.hoverFeatureController.setHoverFeature(null);

    const collection = new Collection([feature]);
    this.translate = new Translate({ features: collection });
    this.translateEndHandler = () => this.handleTranslateEnd();
    this.translate.on('translateend', this.translateEndHandler);
    this.mapInstance.map.addInteraction(this.translate);
  }

  private async handleTranslateEnd(): Promise<void> {
    if (!this.dragInstance || !this.dragFeature) {
      this.removeTranslate();
      return;
    }
    const geom = this.dragFeature.getGeometry();
    const newCoord = (geom ? geom.getCoordinates() : null) as MapCoordinate | null;
    const instance = this.dragInstance;
    this.removeTranslate();
    if (newCoord) {
      this.lastDraggedPoleInstance = instance;
      try {
        await Promise.resolve(this.onEnd(instance, newCoord));
      } catch {
        return; // 保留状态，由 Web 调用 revertPoleDrag 回退
      }
    }
    this.dragInstance = null;
    this.dragFeature = null;
    this.oldCoord = null;
  }

  private removeTranslate(): void {
    if (this.translate && this.translateEndHandler) {
      this.translate.un('translateend', this.translateEndHandler);
      this.translateEndHandler = null;
    }
    if (this.translate) {
      this.mapInstance.map.removeInteraction(this.translate);
      this.translate = null;
    }
  }
}
