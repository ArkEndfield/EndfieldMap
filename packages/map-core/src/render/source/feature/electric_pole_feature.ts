import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const';
import { ConnectionFeature, MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { ElectricPoleData } from '@endfieldmap/map-core/types';
import { action, computed, observable } from 'mobx';
import { Point } from 'ol/geom';
import type { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import { xyz2crd } from '@endfieldmap/tools';

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

  @computed get connections() {
    return this.data.connections;
  }

  @action setConnectionFrom(pole: ElectricPoleFeature) {
    this.data.connections.from = pole.data.levelLogicId;
    this.connectionEntityFeatures.from = pole;
  }

  @action connectTo(pole: ElectricPoleFeature) {
    this.data.connections.to = pole.data.levelLogicId;
    this.connectionEntityFeatures.to = pole;
    this.connectionFeature.setTo(pole);
    pole.setConnectionFrom(this);
  }

  /**
   * 清除指向当前电线杆的连接（被其他电线杆作为 from 连接到当前电线杆）
   */
  @action clearConnectionFrom() {
    this.data.connections.from = null;
    this.connectionEntityFeatures.from = null;
  }

  /**
   * 清除当前电线杆指向其他电线杆的连接（当前电线杆作为 from 指向其他电线杆）
   */
  @action clearConnectionTo() {
    this.data.connections.to = null;
    this.connectionEntityFeatures.to = null;
    this.connectionFeature.clearTo();
  }
}
