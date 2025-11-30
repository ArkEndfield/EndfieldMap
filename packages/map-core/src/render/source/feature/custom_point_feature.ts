import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import { getCustomPointEntityInfo, getDefaultCustomPointType } from '@endfieldmap/map-core/data/custom_point';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { CustomPointData, CustomPointIdKey, EntityInfoData } from '@endfieldmap/map-core/types';
import { xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable, toJS } from 'mobx';
import { Point } from 'ol/geom';

export interface CustomPointFeatureConfig extends BaseFeatureConfig {
  data: CustomPointData;
  entityInfo: EntityInfoData<CustomPointIdKey>;
}

export class CustomPointFeature extends MapFeature {
  public selectable: boolean = false;
  public markable: boolean = false;

  @observable accessor _data: CustomPointData;
  @observable accessor visible: boolean = true;

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
    // 根据当前的 entityDataIdKey 动态获取最新的 entityInfo
    const currentEntityInfo = getCustomPointEntityInfo(plainData.entityDataIdKey) || getDefaultCustomPointType();
    return {
      ...plainData,
      entityInfo: toJS(currentEntityInfo),
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
  public changePointType(pointType: CustomPointIdKey) {
    this._data.entityDataIdKey = pointType;
    // 触发 feature 更新以重新渲染（更新图标）
    this.feature.changed();
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
  get pointType(): CustomPointIdKey {
    return this._data.entityDataIdKey;
  }

  /**
   * 设置自定义标点的可见性
   * @param visible 是否可见
   */
  @action
  public setVisible(visible: boolean) {
    this.visible = visible;
    // 触发 feature 更新以重新渲染
    this.feature.changed();
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
