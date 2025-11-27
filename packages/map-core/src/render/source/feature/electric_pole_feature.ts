import { ELECTRIC_ZONE_RADIUS, EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const';
import { ConnectionFeature, MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { ElectricPoleData, EntityInfoData } from '@endfieldmap/map-core/types';
import { action, computed, observable, toJS } from 'mobx';
import { Point } from 'ol/geom';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { calculateDistance, xyz2crd } from '@endfieldmap/tools';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';

export interface ElectricPoleFeatureConfig extends BaseFeatureConfig {
  data: ElectricPoleData;
  entityInfo: EntityInfoData;
}

export interface ConnectionFeatures {
  from: ElectricPoleFeature | null;
  to: ElectricPoleFeature | null;
}

export class ElectricPoleFeature extends MapFeature {
  public selectable: boolean = false;
  public markable: boolean = false;

  @observable accessor connectionFeature: ConnectionFeature;

  @observable accessor _data: ElectricPoleData;

  @observable accessor connectionEntityFeatures: ConnectionFeatures = {
    from: null,
    to: null,
  };

  constructor(config: ElectricPoleFeatureConfig) {
    super(config);
    this._data = config.data;
    this.connectionFeature = new ConnectionFeature({
      entity: this,
      mapIndex: this.mapIndex,
    });
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

  @action
  public setConnectionFrom(pole: ElectricPoleFeature) {
    this.connectionEntityFeatures.from = pole;
  }

  @action
  public connectTo(pole: ElectricPoleFeature) {
    const distance = calculateDistance(this.coordinates, pole.coordinates);
    if (distance > ELECTRIC_ZONE_RADIUS) {
      // TODO: i18n
      throw new Error(`The distance between the two poles is too far: ${distance}`);
    }
    // 直接修改 _data 而不是 data getter 返回的临时对象
    this._data.properties.connectTo = pole._data.levelLogicId;
    this.connectionEntityFeatures.to = pole;
    this.connectionFeature.setTo(pole);
    pole.setConnectionFrom(this);
    this.notifyElectricPoleChanged();
  }

  /**
   * 清除指向当前电线杆的连接（被其他电线杆作为 from 连接到当前电线杆）
   */
  @action
  public clearConnectionFrom() {
    const fromPole = this.connectionEntityFeatures.from;
    if (fromPole) {
      // 清除对方的 to 引用和连线，但不触发递归
      // 直接修改 _data 而不是 data getter 返回的临时对象
      fromPole._data.properties.connectTo = null;
      fromPole.connectionEntityFeatures.to = null;
      fromPole.connectionFeature.clearTo();
      // 清除当前的 from 引用
      this.connectionEntityFeatures.from = null;
      this.notifyElectricPoleChanged();
    }
  }

  /**
   * 清除当前电线杆指向其他电线杆的连接（当前电线杆作为 from 指向其他电线杆）
   */
  @action
  public clearConnectionTo() {
    const toPole = this.connectionEntityFeatures.to;
    if (toPole) {
      // 清除对方的 from 引用
      toPole.connectionEntityFeatures.from = null;
      // 清除当前的 to 引用和连线
      // 直接修改 _data 而不是 data getter 返回的临时对象
      this._data.properties.connectTo = null;
      this.connectionEntityFeatures.to = null;
      this.connectionFeature.clearTo();
      this.notifyElectricPoleChanged();
    }
  }

  /**
   * 通知电线杆连接关系发生变化
   */
  private notifyElectricPoleChanged() {
    mapEventEmitter.fire(MAP_EVENT.ELECTRIC_POLE_CHANGED, {
      mapIndex: this.mapIndex ?? null,
    });
  }
}
