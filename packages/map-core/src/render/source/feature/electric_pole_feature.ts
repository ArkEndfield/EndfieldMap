import { ELECTRIC_ZONE_RADIUS, EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const';
import { ConnectionFeature, MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { ElectricPoleData } from '@endfieldmap/map-core/types';
import { action, observable } from 'mobx';
import { Point } from 'ol/geom';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { calculateDistance, xyz2crd } from '@endfieldmap/tools';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';

export interface ElectricPoleFeatureConfig extends BaseFeatureConfig {
  data: ElectricPoleData;
}

export interface ConnectionFeatures {
  from: ElectricPoleFeature | null;
  to: ElectricPoleFeature | null;
}

export class ElectricPoleFeature extends MapFeature {
  public selectable: boolean = false;
  public markable: boolean = false;

  @observable accessor connectionFeature: ConnectionFeature;

  @observable accessor data: ElectricPoleData;

  @observable accessor connectionEntityFeatures: ConnectionFeatures = {
    from: null,
    to: null,
  };

  constructor(config: ElectricPoleFeatureConfig) {
    super(config);
    this.data = config.data;
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

  @action
  public setConnectionFrom(pole: ElectricPoleFeature) {
    this.connectionEntityFeatures.from = pole;
  }

  @action
  public connectTo(pole: ElectricPoleFeature) {
    const distance = calculateDistance(this.coordinates, pole.coordinates);
    if (distance > ELECTRIC_ZONE_RADIUS) {
      throw new Error(`The distance between the two poles is too far: ${distance}`);
    }
    this.data.connectTo = pole.data.levelLogicId;
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
    this.connectionEntityFeatures.from?.clearConnectionTo();
    this.connectionEntityFeatures.from = null;
    this.notifyElectricPoleChanged();
  }

  /**
   * 清除当前电线杆指向其他电线杆的连接（当前电线杆作为 from 指向其他电线杆）
   */
  @action
  public clearConnectionTo() {
    this.data.connectTo = null;
    this.connectionEntityFeatures.to = null;
    this.connectionFeature.clearTo();
    this.notifyElectricPoleChanged();
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
