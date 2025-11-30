import { ELECTRIC_ZONE_RADIUS, EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { ConnectionFeature, MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { ElectricPoleData, EntityInfoData } from '@endfieldmap/map-core/types';
import { calculateDistance, xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable, toJS } from 'mobx';
import { Point } from 'ol/geom';

export interface ElectricPoleFeatureConfig extends BaseFeatureConfig {
  data: ElectricPoleData;
  entityInfo: EntityInfoData;
}

export class ElectricPoleFeature extends MapFeature {
  public selectable: boolean = false;
  public markable: boolean = false;

  @observable accessor connectionFeature: ConnectionFeature;

  @observable accessor _data: ElectricPoleData;

  @observable accessor connectionFrom: ElectricPoleFeature | null = null;
  @observable accessor connectionTo: ElectricPoleFeature | null = null;

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
    this.connectionFrom = pole;
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
    this.connectionTo = pole;
    this.connectionFeature.setTo(pole);
    pole.setConnectionFrom(this);
    this.notifyElectricPoleChanged();
  }

  /**
   * 清除指向当前电线杆的连接（被其他电线杆作为 from 连接到当前电线杆）
   */
  @action
  public clearConnectionFrom() {
    const fromPole = this.connectionFrom;
    if (fromPole) {
      // 清除对方的 to 引用和连线，但不触发递归
      // 直接修改 _data 而不是 data getter 返回的临时对象
      fromPole._data.properties.connectTo = null;
      fromPole.connectionTo = null;
      fromPole.connectionFeature.clearTo();
      // 清除当前的 from 引用
      this.connectionFrom = null;
      this.notifyElectricPoleChanged();
    }
  }

  /**
   * 清除当前电线杆指向其他电线杆的连接（当前电线杆作为 from 指向其他电线杆）
   */
  @action
  public clearConnectionTo() {
    const toPole = this.connectionTo;
    if (toPole) {
      // 清除对方的 from 引用
      toPole.connectionFrom = null;
      // 清除当前的 to 引用和连线
      // 直接修改 _data 而不是 data getter 返回的临时对象
      this._data.properties.connectTo = null;
      this.connectionTo = null;
      this.connectionFeature.clearTo();
      this.notifyElectricPoleChanged();
    }
  }

  /**
   * 重命名电线杆
   * @param name 新名称
   */
  @action
  public rename(name: string) {
    this._data.properties.name = name;
    this.notifyElectricPoleChanged();
  }

  /**
   * 获取电线杆名称
   */
  @computed
  get name(): string {
    return this._data.properties.name || `ElectricPole #${this._data.levelLogicId}`;
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
