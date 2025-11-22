import { EntityInstanceKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { Feature } from 'ol';

export interface BaseFeatureConfig {
  mapIndex: MapIndex;
}

export default abstract class FeatureBase {
  // 全局递增序号，用于表示创建顺序（越大越“在上面”）
  private static nextOrder = 0;

  // 地图索引
  public mapIndex: MapIndex;
  // feature
  public feature: Feature;
  // 创建顺序（用于命中时在同一图层内做优先级判定）
  public order: number;
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
    this.order = FeatureBase.nextOrder++;
  }
}
