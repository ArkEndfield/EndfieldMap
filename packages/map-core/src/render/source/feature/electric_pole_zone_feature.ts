import { FeatureType, FeatureTypeKey } from "@endfieldmap/map-core/const/map";
import FeatureBase, { type BaseFeatureConfig } from "@endfieldmap/map-core/render/source/feature/_base";
import type { ElectricPoleData } from "@endfieldmap/map-core/types";
import { xyz2crd } from "@endfieldmap/tools";
import { Circle as CircleGeom } from "ol/geom";

export interface ElectricPoleZoneFeatureConfig extends BaseFeatureConfig {
  /** 电线杆数据 */
  data: ElectricPoleData;
  /** 区域半径（地图坐标单位） */
  radius: number;
}

/**
 * 电线杆覆盖区域 Feature
 * 每个电线杆对应一个圆形区域，尺寸随地图缩放保持一致（使用地图坐标系半径）
 */
export class ElectricPoleZoneFeature extends FeatureBase {
  /** 电线杆数据 */
  public data: ElectricPoleData;
  /** 区域半径（地图坐标单位） */
  public radius: number;
  /** 区域不可选择/标记/激活，仅做展示 */
  public override selectable: boolean = false;
  public override markable: boolean = false;
  public override activable: boolean = false;

  constructor(config: ElectricPoleZoneFeatureConfig) {
    super(config);
    this.data = config.data;
    this.radius = config.radius;
    this.initFeature();
  }

  protected initFeature() {
    const center = xyz2crd(this.data.position, this.mapIndex);
    const geometry = new CircleGeom(center, this.radius);
    this.feature.setGeometry(geometry);
    this.feature.set(FeatureTypeKey, FeatureType.ENTITY);
  }
}
