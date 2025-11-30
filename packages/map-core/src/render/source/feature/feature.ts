import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import FeatureBase, { type BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';
import type { EntityData, EntityInfoData } from '@endfieldmap/map-core/types/entity';
import { xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable, toJS } from 'mobx';
import type { Coordinate } from 'ol/coordinate';
import { LineString, Point } from 'ol/geom';
import VectorSource from 'ol/source/Vector';

export interface MapFeatureConfig extends BaseFeatureConfig {
  data: EntityData;
  entityInfo: EntityInfoData;
}

export interface ConnectionFeatureConfig extends BaseFeatureConfig {
  entity: MapFeature;
}

type FeatureStateProperty = 'marked' | 'isSelected' | 'active';

export class MapFeature extends FeatureBase {
  @observable accessor _data: EntityData;
  @observable accessor entityInfo: EntityInfoData;
  @observable accessor marked: boolean = false;
  @observable accessor isSelected: boolean = false;
  @observable accessor active: boolean = false;
  private _onChange?: () => void;

  constructor(config: MapFeatureConfig) {
    super(config);
    this._data = config.data;
    this.entityInfo = config.entityInfo;
    this.initFeature();
  }

  protected initFeature() {
    const coordinates = xyz2crd(this.data.position, this.mapIndex);
    this.feature.setGeometry(new Point(coordinates));
    this.feature.set(FeatureTypeKey, FeatureType.ENTITY);
  }

  public setOnChange(callback: () => void) {
    this._onChange = callback;
  }

  private updateState(
    property: FeatureStateProperty,
    newValue: boolean,
    shouldTriggerOnChange: boolean = true
  ): boolean {
    const currentValue = this[property];
    if (currentValue === newValue) {
      return false;
    }

    this[property] = newValue;

    if (shouldTriggerOnChange) {
      this._onChange?.();
    }

    mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
      feature: this,
      property,
      oldValue: currentValue,
      newValue,
    });

    return true;
  }

  @action
  public setMarked(marked: boolean) {
    if (this.markable) {
      this.updateState('marked', marked);
    }
  }

  public toggleMarked(): boolean {
    if (!this.markable) {
      return false;
    }
    const newValue = !this.marked;
    this.setMarked(newValue);
    return newValue;
  }

  @action
  public setIsSelected(isSelected: boolean) {
    if (this.selectable) {
      this.updateState('isSelected', isSelected);
    }
  }

  @action
  public setActive(active: boolean) {
    if (this.activable) {
      this.updateState('active', active, false);
    }
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

  @computed
  get id(): number {
    return this.data.levelLogicId;
  }

  @computed
  get coordinates(): Coordinate {
    return xyz2crd(this.data.position, this.mapIndex);
  }
}

export class ConnectionFeature extends FeatureBase {
  /** 能否被选择 */
  public selectable: boolean = false;
  /** 能否被标记 */
  public markable: boolean = false;
  /** 能否被激活 */
  public activable: boolean = false;
  /** connection source */
  public connectionSource!: VectorSource;
  /** 起始feature */
  @observable accessor from!: MapFeature;
  /** 结束feature */
  @observable accessor to: MapFeature | null;

  constructor(config: ConnectionFeatureConfig) {
    super(config);
    this.from = config.entity;
    this.to = null;
    this.initFeature();
  }

  protected initFeature() {
    this.feature.set(FeatureTypeKey, FeatureType.CONNECTION);
  }

  @action
  public setTo(to: MapFeature) {
    if (this.to) {
      return;
    }
    this.to = to;
    this.feature.setGeometry(new LineString([this.from.coordinates, to.coordinates]));
  }

  @action
  public clearTo() {
    this.to = null;
    this.feature.setGeometry(undefined);
  }

  @computed
  get coordinates(): [Coordinate, Coordinate] {
    return [this.from.coordinates, this.to?.coordinates ?? [0, 0]];
  }

  @computed
  get data() {
    return {
      from: this.from.data.levelLogicId,
      to: this.to?.data?.levelLogicId,
    };
  }
}
