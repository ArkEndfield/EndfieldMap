import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
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
 * 区域样式
 */
const ZONE_STYLE = new Style({
  fill: new Fill({ color: 'rgba(0, 128, 255, 0.08)' }),
  stroke: new Stroke({ color: 'rgba(0, 160, 255, 0.35)', width: 1.5 }),
});

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
      style: ZONE_STYLE,
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
    this.layer.dispose();
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
    // Set properties for potential debugging or styling
    feature.set('visible', item.visible);

    this.featureMap.set(item.id, feature);
    this.source.addFeature(feature);
  }

  // #endregion
}
