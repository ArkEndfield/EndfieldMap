import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { CustomPointData, EntityInfoData } from '@endfieldmap/map-core/types';
import { action, computed, observable, toJS } from 'mobx';
import { Point } from 'ol/geom';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { xyz2crd } from '@endfieldmap/tools';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';

export interface CustomPointFeatureConfig extends BaseFeatureConfig {
  data: CustomPointData;
  entityInfo: EntityInfoData;
}

export class CustomPointFeature extends MapFeature {
  public selectable: boolean = false;
  public markable: boolean = false;

  @observable accessor _data: CustomPointData;

  constructor(config: CustomPointFeatureConfig) {
    super(config);
    this._data = config.data;
  }

  protected initFeature() {
    const coordinates = xyz2crd(this.data.position, this.mapIndex);
    this.feature.setGeometry(new Point(coordinates));
    this.feature.set(FeatureTypeKey, FeatureType.ENTITY);
    this.feature.set(EntityInstanceKey, this);
  }

  @computed
  get data() {
    // 使用 toJS 将 MobX observable 转换为普通对象，确保序列化时属性不会丢失
    const plainData = toJS(this._data);
    return {
      ...plainData,
      entityInfo: toJS(this.entityInfo),
    };
  }

  /**
   * 重命名自定义标点
   * @param name 新名称
   */
  @action
  public rename(name: string) {
    this._data.properties.name = name;
    this.notifyCustomPointChanged();
  }

  /**
   * 更改自定义标点类型
   * @param pointType 新类型
   */
  @action
  public changePointType(pointType: string) {
    this._data.properties.pointType = pointType;
    this.notifyCustomPointChanged();
  }

  /**
   * 获取自定义标点名称
   */
  @computed
  get name(): string {
    return this._data.properties.name || `CustomPoint #${this._data.levelLogicId}`;
  }

  /**
   * 获取自定义标点类型
   */
  @computed
  get pointType(): string {
    return this._data.properties.pointType || this._data.entityDataIdKey;
  }

  /**
   * 通知自定义标点数据发生变化
   */
  private notifyCustomPointChanged() {
    mapEventEmitter.fire(MAP_EVENT.CUSTOM_POINT_CHANGED, {
      mapIndex: this.mapIndex ?? null,
    });
  }
}
