import { getCustomPointEntityInfo, getDefaultCustomPointType } from '@endfieldmap/map-core/data/custom_point';
import SourceBase, { type BaseSourceConfig } from '@endfieldmap/map-core/render/source/_base';
import { CustomPointFeature } from '@endfieldmap/map-core/render/source/feature/custom_point_feature';
import type { CustomPointData, CustomPointDataList } from '@endfieldmap/map-core/types';

export interface CustomPointSourceConfig extends BaseSourceConfig {
  data: CustomPointDataList;
}

export class CustomPointSource extends SourceBase<CustomPointFeature, CustomPointSourceConfig> {
  constructor(config: CustomPointSourceConfig) {
    super(config);
    this.initSource();
  }

  private initSource() {
    for (const data of this.config.data) {
      const entityInfo = getCustomPointEntityInfo(data.entityDataIdKey) || getDefaultCustomPointType();
      const feature = new CustomPointFeature({
        data,
        mapIndex: this.config.mapIndex,
        entityInfo,
      });
      // 当 CustomPointFeature 的状态（如 active/marked 等）变化时，通知 OL 重新渲染样式
      feature.setOnChange(() => {
        feature.feature.changed();
      });
      this.addFeature(feature);
    }
  }

  public addCustomPointEntity(data: CustomPointData) {
    const entityInfo = getCustomPointEntityInfo(data.entityDataIdKey) || getDefaultCustomPointType();
    const feature = new CustomPointFeature({
      data,
      mapIndex: this.config.mapIndex,
      entityInfo,
    });
    this.addFeature(feature);
    // 新增的自定义标点实体同样需要在状态变化时触发样式更新
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
