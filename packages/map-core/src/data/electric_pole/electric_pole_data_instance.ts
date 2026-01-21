import {
  type ElectricPoleDeviceKey,
  getElectricPoleDeviceConfig,
  getElectricPoleRangeRadius,
  isSameElectricPoleConnectionType,
  LEGACY_ELECTRIC_POLE_DEVICE_KEY,
} from '@endfieldmap/map-core/const/electric_pole';
import { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import type { EntityInfo } from '@endfieldmap/map-core/data/entity';
import type { ElectricPoleData, ElectricPoleDataInstanceConfig } from '@endfieldmap/map-core/types/entity';
import { calculateDistance, ElectricPoleError, xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 电线杆数据实例
 * 负责管理单个电线杆的数据和状态
 */
export class ElectricPoleDataInstance extends BaseDataInstance<ElectricPoleData> {
  /** Entity信息 */
  @computed
  get entityInfo(): EntityInfo {
    return this._data.entityInfo!;
  }

  /** 是否可标记（电线杆不支持标记） */
  public readonly markable: boolean = false;
  /** 是否可选择 */
  public readonly selectable: boolean = false;
  /** 是否可以重命名 */
  public readonly renameable: boolean = true;
  /** 是否可以删除 */
  public readonly deletable: boolean = true;

  /** 发出的连线（当前电线杆发出） */
  @observable.shallow
  accessor outgoingConnections: ElectricPoleDataInstance[] = [];

  /** 接收的连线（其他电线杆发出到当前） */
  @observable.shallow
  accessor incomingConnections: ElectricPoleDataInstance[] = [];

  constructor(config: ElectricPoleDataInstanceConfig) {
    super({
      data: config.data,
      mapIndex: config.mapIndex,
    });
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
  get outgoingConnectionIds(): number[] {
    const connections = this._data.properties.connections;
    if (Array.isArray(connections)) {
      return connections.filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
    }

    const legacy = this._data.properties.connectTo;
    return typeof legacy === 'number' && Number.isFinite(legacy) ? [legacy] : [];
  }

  /**
   * 获取覆盖区域半径
   */
  @computed
  get zoneRadius(): number {
    return getElectricPoleRangeRadius(this.mapIndex, this.deviceKey);
  }

  /**
   * 获取设备类型
   */
  @computed
  get deviceKey(): ElectricPoleDeviceKey {
    return this._data.properties.deviceKey ?? LEGACY_ELECTRIC_POLE_DEVICE_KEY;
  }

  /**
   * 获取当前连接对象（去重，包含入/出）
   */
  @computed
  get connectedPoles(): ElectricPoleDataInstance[] {
    const byId = new Map<number, ElectricPoleDataInstance>();
    for (const i of this.outgoingConnections) byId.set(i.id, i);
    for (const i of this.incomingConnections) byId.set(i.id, i);
    return [...byId.values()];
  }

  @computed
  get connectionCount(): number {
    return this.connectedPoles.length;
  }

  /**
   * 是否已连接
   */
  @computed
  get isConnected(): boolean {
    return this.connectionCount > 0;
  }

  /**
   * 设置发出连线引用（由 DataManager 同步）
   */
  @action
  public setOutgoingConnections(connections: ElectricPoleDataInstance[]): void {
    this.outgoingConnections = connections;
  }

  /**
   * 设置接收连线引用（由 DataManager 同步）
   */
  @action
  public setIncomingConnections(connections: ElectricPoleDataInstance[]): void {
    this.incomingConnections = connections;
  }

  /**
   * 覆盖发出连线 ID 列表（用于数据加载时同步）
   */
  @action
  public setOutgoingConnectionIds(ids: number[]): void {
    this._data.properties.connections = ids;
    if (Object.prototype.hasOwnProperty.call(this._data.properties, 'connectTo')) {
      this._data.properties.connectTo = null;
    }
  }

  /**
   * 发出连线到目标对象
   */
  @action
  public connectTo(pole: ElectricPoleDataInstance): void {
    if (pole.id === this.id) {
      throw new ElectricPoleError('connect_to_self', this.id);
    }

    if (!isSameElectricPoleConnectionType(this.deviceKey, pole.deviceKey)) {
      throw new ElectricPoleError('different_connection_type', this.id);
    }

    if (this.isConnectedTo(pole.id)) {
      throw new ElectricPoleError('already_connected', this.id);
    }

    const fromLimit = getElectricPoleDeviceConfig(this.deviceKey).maxConnections;
    if (fromLimit !== false && this.connectionCount >= fromLimit) {
      throw new ElectricPoleError('source_slots_full', this.id);
    }

    const toLimit = getElectricPoleDeviceConfig(pole.deviceKey).maxConnections;
    if (toLimit !== false && pole.connectionCount >= toLimit) {
      throw new ElectricPoleError('target_slots_full', pole.id);
    }

    // 检查距离
    const distance = calculateDistance(this.coordinates, pole.coordinates);
    if (distance > this.zoneRadius) {
      throw new ElectricPoleError('distance_too_far', this.id);
    }

    if (!Array.isArray(this._data.properties.connections)) {
      this._data.properties.connections = [];
    }

    const connections = this._data.properties.connections;
    if (!connections.includes(pole.id)) {
      connections.push(pole.id);
    }

    this.outgoingConnections = [...this.outgoingConnections, pole];
    pole.incomingConnections = [...pole.incomingConnections, this];
  }

  /**
   * 断开由当前对象发出的连线
   */
  @action
  public disconnectOutgoingTo(targetId: number): boolean {
    const targetIndex = this.outgoingConnections.findIndex((p) => p.id === targetId);
    if (targetIndex === -1) {
      return false;
    }

    const target = this.outgoingConnections[targetIndex]!;
    const connections = this._data.properties.connections;
    if (Array.isArray(connections)) {
      this._data.properties.connections = connections.filter((id) => id !== targetId);
    }

    this.outgoingConnections = this.outgoingConnections.filter((p) => p.id !== targetId);
    target.incomingConnections = target.incomingConnections.filter((p) => p.id !== this.id);
    return true;
  }

  /**
   * 清除所有连接（包含入/出）
   */
  @action
  public clearAllConnections(): void {
    const outgoing = [...this.outgoingConnections];
    for (const target of outgoing) {
      this.disconnectOutgoingTo(target.id);
    }

    const incoming = [...this.incomingConnections];
    for (const source of incoming) {
      source.disconnectOutgoingTo(this.id);
    }
  }

  public isConnectedTo(targetId: number): boolean {
    return (
      this.outgoingConnections.some((p) => p.id === targetId) || this.incomingConnections.some((p) => p.id === targetId)
    );
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
