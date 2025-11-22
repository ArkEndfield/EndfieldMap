import type { Coordinate } from 'ol/coordinate';
import { FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { EntityData, EntityInfoData } from '@endfieldmap/map-core/types/entity';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { xyz2crd } from '@endfieldmap/tools';
import { LineString, Point } from 'ol/geom';
import { action, computed, observable } from 'mobx';
import VectorSource from 'ol/source/Vector';
import FeatureBase, { BaseFeatureConfig } from '@endfieldmap/map-core/render/source/feature/_base';

export interface MapFeatureConfig extends BaseFeatureConfig {
  data: EntityData;
  entityInfo: EntityInfoData;
}

export interface ConnectionFeatureConfig extends BaseFeatureConfig {
  entity: MapFeature;
}

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

  /**
   * 设置onChange回调，当状态改变时触发
   * @param callback 回调函数
   */
  public setOnChange(callback: () => void) {
    this._onChange = callback;
  }

  /**
   * 设置marked状态
   * @param marked 是否标记
   */
  @action
  public setMarked(marked: boolean) {
    if (!this.markable) {
      return;
    }
    if (this.marked !== marked) {
      const oldValue = this.marked;
      this.marked = marked;
      this._onChange?.();

      // 触发状态变化事件
      mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
        feature: this,
        property: 'marked',
        oldValue,
        newValue: marked,
      });
    }
  }

  /**
   * 切换marked状态
   */
  public toggleMarked() {
    if (!this.markable) {
      return false;
    }
    const marked = !this.marked;
    this.setMarked(marked);
    return marked;
  }

  /**
   * 设置isSelected状态
   * @param isSelected 是否选中
   */
  @action
  public setIsSelected(isSelected: boolean) {
    if (!this.selectable) {
      return;
    }
    if (this.isSelected !== isSelected) {
      const oldValue = this.isSelected;
      this.isSelected = isSelected;
      this._onChange?.();

      // 触发状态变化事件
      mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
        feature: this,
        property: 'isSelected',
        oldValue,
        newValue: isSelected,
      });
    }
  }

  /**
   * 设置active状态
   * @param active 是否激活
   */
  @action
  public setActive(active: boolean) {
    if (!this.activable) {
      return;
    }
    if (this.active !== active) {
      const oldValue = this.active;
      this.active = active;
      // 不再调用 _onChange，因为 active 状态由独立的 ActiveLayer 处理

      // 触发状态变化事件
      mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
        feature: this,
        property: 'active',
        oldValue,
        newValue: active,
      });
    }
  }

  @computed
  get data(): EntityData & { entityInfo: EntityInfoData } {
    return {
      ...this._data,
      entityInfo: this.entityInfo,
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
