import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS } from '@endfieldmap/map-core/const/electric_pole';
import { logger } from '@endfieldmap/tools';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Circle as CircleGeom } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/**
 * 按设备类型缓存区域样式，避免每次渲染都重新创建
 */
const zoneStyleCache = new Map<string, Style>();

function getZoneStyle(deviceKey: string): Style {
  let style = zoneStyleCache.get(deviceKey);
  if (!style) {
    const config = ELECTRIC_POLE_DEVICE_CONFIGS[deviceKey as keyof typeof ELECTRIC_POLE_DEVICE_CONFIGS];
    const fillColor = config?.fillColor ?? 'rgba(228, 169, 21, 0.15)';
    const strokeColor = config?.strokeColor ?? '#E4A915';
    style = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 1.5 }),
    });
    zoneStyleCache.set(deviceKey, style);
  }
  return style;
}

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

  constructor(initialVisible: boolean = true) {
    logger.debug('[ElectricPoleZoneRenderer] init', { initialVisible });
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: (feature) => getZoneStyle(feature.get('deviceKey') as string),
      visible: initialVisible,
      zIndex: 10,
    });
  }

  // #region 公共 API —— 由 Controller 调用

  /**
   * 批量添加 zones
   */
  public addZones(items: ZoneData[]): void {
    for (const item of items) {
      this.addSingleZone(item);
    }
  }

  /**
   * 移除指定的 zones
   */
  public removeZones(ids: number[]): void {
    for (const id of ids) {
      const feature = this.featureMap.get(id);
      if (feature) {
        this.source.removeFeature(feature);
        this.featureMap.delete(id);
      }
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
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
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
   * 添加单个 zone
   */
  private addSingleZone(item: ZoneData): void {
    logger.debug('[ElectricPoleZoneRenderer] addSingleZone', { id: item.id, visible: item.visible });
    const feature = new Feature();

    if (item.visible) {
      feature.setGeometry(new CircleGeom(item.coordinates, item.radius));
    }
    feature.set('visible', item.visible);
    feature.set('deviceKey', item.dataInstance.deviceKey);

    this.featureMap.set(item.id, feature);
    this.source.addFeature(feature);
  }

  // #endregion
}
