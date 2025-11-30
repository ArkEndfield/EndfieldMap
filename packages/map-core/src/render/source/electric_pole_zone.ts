import SourceBase, { type BaseSourceConfig } from '@endfieldmap/map-core/render/source/_base';
import { ElectricPoleZoneFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_zone_feature';
import type { ElectricPoleData, ElectricPoleDataList } from '@endfieldmap/map-core/types';

export interface ElectricPoleZoneSourceConfig extends BaseSourceConfig {
  /** 电线杆数据列表 */
  data: ElectricPoleDataList;
  /** 区域半径（地图坐标单位） */
  radius: number;
}

/**
 * 电线杆覆盖区域 Source
 */
export class ElectricPoleZoneSource extends SourceBase<ElectricPoleZoneFeature, ElectricPoleZoneSourceConfig> {
  constructor(config: ElectricPoleZoneSourceConfig) {
    super(config);
    this.initSource();
  }

  private initSource() {
    for (const data of this.config.data) {
      this.addZone(data);
    }
  }

  /**
   * 为指定电线杆数据添加覆盖区域
   */
  public addZone(data: ElectricPoleData) {
    const feature = new ElectricPoleZoneFeature({
      data,
      mapIndex: this.config.mapIndex,
      radius: this.config.radius,
    });
    this.addFeature(feature);
    return feature;
  }

  /**
   * 根据 levelLogicId 删除对应覆盖区域
   */
  public removeZoneById(id: number) {
    const feature = this.features.find((f) => f.data.levelLogicId === id);
    if (feature) {
      this.removeFeature(feature);
    }
  }
}
