import { EntityInstanceKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { Feature } from 'ol';

export interface BaseFeatureConfig {
  mapIndex: MapIndex;
}

export default abstract class FeatureBase {
  // 地图索引
  public mapIndex: MapIndex;
  // feature
  public feature: Feature;
  // 能否被选择
  public selectable: boolean = true;
  // 能否被标记
  public markable: boolean = true;
  // 能否被激活
  public activable: boolean = true;

  constructor(config: BaseFeatureConfig) {
    this.mapIndex = config.mapIndex;
    this.feature = new Feature();
    this.feature.set(EntityInstanceKey, this);
  }
}
