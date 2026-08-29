import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS } from '@endfieldmap/map-core/const/electric_pole';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { Circle as CircleGeom } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

import { easeOutCubic } from "../../../easing";

/**
 * 按设备类型与是否高亮缓存区域样式，避免每次渲染都重新创建
 * key: `${deviceKey}-${highlighted}`
 */
const zoneStyleCache = new Map<string, Style>();

function getZoneStyle(deviceKey: string, highlighted: boolean = false): Style {
  const key = `${deviceKey}-${highlighted}`;
  let style = zoneStyleCache.get(key);
  if (!style) {
    const config = ELECTRIC_POLE_DEVICE_CONFIGS[deviceKey as keyof typeof ELECTRIC_POLE_DEVICE_CONFIGS];
    const fillColor = highlighted
      ? (config?.hoverFill ?? config?.fillColor ?? 'rgba(228, 169, 21, 0.15)')
      : (config?.fillColor ?? 'rgba(228, 169, 21, 0.15)');
    const strokeColor = highlighted
      ? (config?.hoverStroke ?? config?.strokeColor ?? '#E4A915')
      : (config?.strokeColor ?? '#E4A915');
    style = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 1.5 }),
    });
    zoneStyleCache.set(key, style);
  }
  return style;
}

/** Zone 添加选项 */
export interface AddZoneOptions {
  /** 是否从半径 0 做展开动画（仅对新建的可见 zone 生效） */
  animate?: boolean;
}

/** Zone 移除选项 */
export interface RemoveZoneOptions {
  /** 是否先收缩到半径 0 再移除 */
  animate?: boolean;
}

/** Zone 半径展开动画时长（毫秒） */
const ZONE_ANIMATION_DURATION_MS = 320;

/**
 * Zone 数据
 */
export interface ZoneData {
  /** 实例ID */
  id: number;
  /** 中心坐标 */
  coordinates: Coordinate;
  /** 半径 */
  radius: number;
  /** 关联的数据实例 */
  dataInstance: ElectricPoleDataInstance;
  /** 是否可见 */
  visible: boolean;
}

/**
 * 电线杆区域渲染器（VectorLayer）
 * 渲染电线杆的覆盖区域圆
 *
 * 设计原则：
 * - 不持有 DataManager 引用
 * - 不包含 MobX 监听
 * - 通过 Controller 显式调用 addZone/removeZone/updateZone 更新渲染
 * - 保持 VectorLayer（Circle 几何体不支持 WebGL）
 */
export class ElectricPoleZoneRenderer {
  /** 图层实例 */
  public readonly layer: VectorLayer;

  /** 数据源 */
  private readonly source: VectorSource;

  /** Feature 映射：dataInstance.id -> Feature */
  private featureMap: Map<number, Feature> = new Map();

  /** 正在做半径展开动画的 zone：id -> 动画开始时间戳 */
  private animatingZoneStarts: Map<number, number> = new Map();

  /** 正在做收缩动画的 zone：id -> { startTime, startRadius, coordinates }，动画结束后从 source/featureMap 移除 */
  private shrinkingZones: Map<
    number,
    { startTime: number; startRadius: number; coordinates: Coordinate }
  > = new Map();

  /** 动画循环的 RAF id，未运行时为 null */
  private animationRafId: number | null = null;

  /** 当前 hover 的电线杆 id（该杆的 zone 使用更高填充不透明度） */
  @observable accessor hoveredPoleId: number | null = null;

  constructor(initialVisible: boolean = true) {
    logger.debug('[ElectricPoleZoneRenderer] init', { initialVisible });
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: this.zoneStyleFunction.bind(this),
      visible: initialVisible,
      zIndex: Z_INDEX.ZONE,
    });
  }

  private zoneStyleFunction(feature: FeatureLike): Style {
    const deviceKey = feature.get('deviceKey') as string;
    const instanceId = feature.get('instanceId') as number | undefined;
    const highlighted = this.hoveredPoleId != null && instanceId === this.hoveredPoleId;
    return getZoneStyle(deviceKey, highlighted);
  }

  // #region 公共 API —— 由 Controller 调用

  /**
   * 批量添加 zones
   * @param options.animate 为 true 时，zone 从半径 0 展开到目标半径（仅对 visible 的 zone 生效）
   */
  public addZones(items: ZoneData[], options?: AddZoneOptions): void {
    const animate = options?.animate === true;
    for (const item of items) {
      this.addSingleZone(item, animate);
    }
    if (animate && this.animatingZoneStarts.size > 0) {
      this.startAnimationLoop();
    }
  }

  /**
   * 移除指定的 zones
   * @param options.animate 为 true 时，先收缩到半径 0 再移除
   */
  public removeZones(ids: number[], options?: RemoveZoneOptions): void {
    const animate = options?.animate === true;

    for (const id of ids) {
      this.animatingZoneStarts.delete(id);
      const feature = this.featureMap.get(id);
      if (!feature) continue;

      if (animate) {
        const geom = feature.getGeometry() as CircleGeom | undefined;
        if (geom) {
          const center = geom.getCenter();
          const startRadius = geom.getRadius();
          if (startRadius > 0) {
            this.shrinkingZones.set(id, {
              startTime: performance.now(),
              startRadius,
              coordinates: center,
            });
            this.startAnimationLoop();
            continue;
          }
        }
      }

      this.shrinkingZones.delete(id);
      this.source.removeFeature(feature);
      this.featureMap.delete(id);
    }
  }

  /**
   * 更新 zone 的可见性（通过几何体控制）
   */
  public updateZoneVisibility(id: number, visible: boolean, coordinates?: Coordinate, radius?: number): void {
    const feature = this.featureMap.get(id);
    if (!feature) return;

    if (visible && coordinates && radius) {
      feature.setGeometry(new CircleGeom(coordinates, radius));
    } else if (!visible) {
      feature.setGeometry(undefined);
    }
    feature.set('visible', visible);
  }

  /**
   * 更新 zone 的几何体
   */
  public updateZoneGeometry(id: number, coordinates: Coordinate, radius: number): void {
    const feature = this.featureMap.get(id);
    if (feature) {
      feature.setGeometry(new CircleGeom(coordinates, radius));
    }
  }

  /**
   * 设置图层可见性
   */
  public setVisible(visible: boolean): void {
    logger.debug('[ElectricPoleZoneRenderer] setVisible', { visible });
    this.layer.setVisible(visible);
  }

  /**
   * 获取图层可见性
   */
  public getVisible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 设置当前 hover 的电线杆 id（该杆的 zone 填充不透明度提高）
   */
  @action
  public setHoveredPoleId(poleId: number | null): void {
    if (this.hoveredPoleId === poleId) return;
    this.hoveredPoleId = poleId;
    this.layer.changed();
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
    if (this.animationRafId != null) {
      cancelAnimationFrame(this.animationRafId);
      this.animationRafId = null;
    }
    this.animatingZoneStarts.clear();
    this.shrinkingZones.clear();
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
   * 添加单个 zone
   * @param animate 为 true 且 visible 时，先以半径 0 添加，由动画循环展开到 item.radius
   */
  private addSingleZone(item: ZoneData, animate: boolean = false): void {
    logger.debug('[ElectricPoleZoneRenderer] addSingleZone', { id: item.id, visible: item.visible, animate });
    const feature = new Feature();

    const wantAnimate = animate && item.visible && item.radius > 0;
    if (item.visible) {
      const initialRadius = wantAnimate ? 0 : item.radius;
      feature.setGeometry(new CircleGeom(item.coordinates, initialRadius));
    }
    feature.set('visible', item.visible);
    feature.set('deviceKey', item.dataInstance.deviceKey);
    feature.set('instanceId', item.id);
    // 动画用：目标半径与中心（动画时每帧更新几何）
    feature.set('targetRadius', item.radius);
    feature.set('targetCoordinates', item.coordinates);

    this.featureMap.set(item.id, feature);
    this.source.addFeature(feature);

    if (wantAnimate) {
      this.animatingZoneStarts.set(item.id, performance.now());
    }
  }

  private startAnimationLoop(): void {
    if (this.animationRafId != null) return;

    const tick = (): void => {
      this.animationRafId = null;
      const now = performance.now();
      let hasUpdates = false;
      const idsToRemove: number[] = [];

      // 展开动画：0 -> targetRadius
      for (const [id, startTime] of this.animatingZoneStarts) {
        const feature = this.featureMap.get(id);
        if (!feature) {
          this.animatingZoneStarts.delete(id);
          continue;
        }
        const targetRadius = feature.get('targetRadius') as number;
        const targetCoordinates = feature.get('targetCoordinates') as Coordinate;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / ZONE_ANIMATION_DURATION_MS);
        const t = easeOutCubic(progress);
        const currentRadius = t * targetRadius;

        feature.setGeometry(new CircleGeom(targetCoordinates, currentRadius));
        hasUpdates = true;

        if (progress >= 1) {
          this.animatingZoneStarts.delete(id);
        }
      }

      // 收缩动画：startRadius -> 0，结束后移除 feature
      for (const [id, state] of this.shrinkingZones) {
        const feature = this.featureMap.get(id);
        if (!feature) {
          this.shrinkingZones.delete(id);
          continue;
        }
        const elapsed = now - state.startTime;
        const progress = Math.min(1, elapsed / ZONE_ANIMATION_DURATION_MS);
        const t = easeOutCubic(progress);
        const currentRadius = state.startRadius * (1 - t);

        feature.setGeometry(new CircleGeom(state.coordinates, currentRadius));
        hasUpdates = true;

        if (progress >= 1) {
          idsToRemove.push(id);
          this.shrinkingZones.delete(id);
        }
      }

      for (const id of idsToRemove) {
        const feature = this.featureMap.get(id);
        if (feature) {
          this.source.removeFeature(feature);
          this.featureMap.delete(id);
        }
      }

      if (hasUpdates || idsToRemove.length > 0) {
        this.layer.changed();
      }
      if (this.animatingZoneStarts.size > 0 || this.shrinkingZones.size > 0) {
        this.animationRafId = requestAnimationFrame(tick);
      }
    };

    this.animationRafId = requestAnimationFrame(tick);
  }

  // #endregion
}
