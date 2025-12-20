import { ELECTRIC_ZONE_RADIUS } from '@endfieldmap/map-core/const/map';
import { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import type { EntityInfo } from '@endfieldmap/map-core/data/entity';
import type { ElectricPoleData,ElectricPoleDataInstanceConfig } from '@endfieldmap/map-core/types/entity';
import { calculateDistance, xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 电线杆数据实例
 * 负责管理单个电线杆的数据和状态
 */
export class ElectricPoleDataInstance extends BaseDataInstance<ElectricPoleData> {
  /** Entity信息 */
  @observable
  accessor entityInfo: EntityInfo;

  /** 是否可标记（电线杆不支持标记） */
  public readonly markable: boolean = false;
  /** 是否可选择 */
  public readonly selectable: boolean = false;

  /** 连接来源（指向当前电线杆的电线杆） */
  @observable
  accessor connectionFrom: ElectricPoleDataInstance | null = null;

  /** 连接目标（当前电线杆指向的电线杆） */
  @observable
  accessor connectionTo: ElectricPoleDataInstance | null = null;

  constructor(config: ElectricPoleDataInstanceConfig) {
    super({
      data: config.data,
      mapIndex: config.mapIndex,
    });
    this.entityInfo = config.entityInfo;
  }

  /**
   * 获取坐标
   */
  @computed
  get coordinates(): Coordinate {
    return xyz2crd(this._data.position, this.mapIndex);
  }

  /**
   * 获取连接目标ID
   */
  @computed
  get connectToId(): number | null {
    return this._data.properties.connectTo;
  }

  /**
   * 获取覆盖区域半径
   */
  @computed
  get zoneRadius(): number {
    return ELECTRIC_ZONE_RADIUS[this.mapIndex] ?? 10;
  }

  /**
   * 设置连接来源
   */
  @action
  public setConnectionFrom(pole: ElectricPoleDataInstance | null): void {
    this.connectionFrom = pole;
  }

  /**
   * 连接到目标电线杆
   */
  @action
  public connectTo(pole: ElectricPoleDataInstance): void {
    // 检查距离
    const distance = calculateDistance(this.coordinates, pole.coordinates);
    if (distance > this.zoneRadius) {
      throw new Error(`The distance between the two poles is too far: ${distance}`);
    }

    // 设置连接
    this._data.properties.connectTo = pole.id;
    this.connectionTo = pole;
    pole.setConnectionFrom(this);
  }

  /**
   * 清除连接来源
   */
  @action
  public clearConnectionFrom(): void {
    const fromPole = this.connectionFrom;
    if (fromPole) {
      fromPole._data.properties.connectTo = null;
      fromPole.connectionTo = null;
      this.connectionFrom = null;
    }
  }

  /**
   * 清除连接目标
   */
  @action
  public clearConnectionTo(): void {
    const toPole = this.connectionTo;
    if (toPole) {
      toPole.connectionFrom = null;
      this._data.properties.connectTo = null;
      this.connectionTo = null;
    }
  }

  /**
   * 清除所有连接
   */
  @action
  public clearAllConnections(): void {
    this.clearConnectionFrom();
    this.clearConnectionTo();
  }

  /**
   * 是否已连接
   */
  @computed
  get isConnected(): boolean {
    return this.connectionTo !== null || this.connectionFrom !== null;
  }

  /**
   * 重命名
   */
  @action
  public rename(name: string): void {
    this._data.properties.name = name;
  }

  /**
   * 获取名称
   */
  @computed
  get name(): string {
    return this._data.properties.name ?? `ElectricPole #${this.id}`;
  }

  /**
   * 禁用标记功能
   */
  @action
  public setMarked(_marked: boolean): void {
    // 电线杆不支持标记
  }

  /**
   * 禁用选中功能
   */
  @action
  public setSelected(_selected: boolean): void {
    // 电线杆不支持选中
  }
}
