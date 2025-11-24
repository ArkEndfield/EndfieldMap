import { electricPoleEntityInfo } from '@endfieldmap/map-core/const/entity';
import SourceBase, { BaseSourceConfig } from '@endfieldmap/map-core/render/source/_base';
import { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import type { ElectricPoleData, ElectricPoleDataList } from '@endfieldmap/map-core/types';

export interface ElectricPoleSourceConfig extends BaseSourceConfig {
  data: ElectricPoleDataList;
}

export class ElectricPoleSource extends SourceBase<ElectricPoleFeature, ElectricPoleSourceConfig> {
  constructor(config: ElectricPoleSourceConfig) {
    super(config);
    this.initSource();
  }

  private initSource() {
    for (const data of this.config.data) {
      const feature = new ElectricPoleFeature({
        data,
        mapIndex: this.config.mapIndex,
        entityInfo: electricPoleEntityInfo
      });
      // 当 ElectricPoleFeature 的状态（如 active/marked 等）变化时，通知 OL 重新渲染样式
      feature.setOnChange(() => {
        feature.feature.changed();
      });
      this.addFeature(feature);
    }
  }

  public addElectricPoleEntity(data: ElectricPoleData) {
    const feature = new ElectricPoleFeature({
      data,
      mapIndex: this.config.mapIndex,
      entityInfo: electricPoleEntityInfo
    });
    this.addFeature(feature);
    // 新增的电线杆实体同样需要在状态变化时触发样式更新
    feature.setOnChange(() => {
      feature.feature.changed();
    });
    return feature;
  }

  public get data() {
    return this.features.getArray().map((feature) => feature.data);
  }

  public getFeatureById(id: number) {
    return this.features.getArray().find((feature) => feature.id === id);
  }
}
