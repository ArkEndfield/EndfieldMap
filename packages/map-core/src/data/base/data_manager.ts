import type { BaseDataInstance } from '@endfieldmap/map-core/data/base/data_instance';
import type { DataManagerConfig } from '@endfieldmap/map-core/data/base/types';
import type { MapData } from '@endfieldmap/map-core/types';
import type { BaseEntityDataWithInfo } from '@endfieldmap/map-core/types/entity';
import { action, computed, observable } from 'mobx';

/**
 * 数据管理器基类
 * 负责管理某一类数据实例的集合
 * 提供增删查改等基本操作
 */
export abstract class BaseDataManager<T extends BaseEntityDataWithInfo, I extends BaseDataInstance<T>> {
  /** 地图ID */
  public readonly mapId: MapData['id'];

  /** 数据实例集合 */
  @observable
  accessor instances: I[] = [];

  /** ID到实例的映射，用于快速查找 */
  protected accessor instanceMap: Map<number, I> = new Map();

  constructor(config: DataManagerConfig) {
    this.mapId = config.mapId;
  }

  /**
   * 创建数据实例
   * 子类需要实现此方法来创建具体类型的数据实例
   */
  protected abstract createInstance(data: T): I;

  /**
   * 获取所有实例数量
   */
  @computed
  get count(): number {
    return this.instances.length;
  }

  /**
   * 获取所有原始数据
   */
  @computed
  get dataList(): ReadonlyArray<Readonly<T>> {
    return this.instances.map((instance) => instance.data);
  }

  /**
   * 根据ID获取实例
   */
  public getById(id: number): I | undefined {
    return this.instanceMap.get(id);
  }

  /**
   * 检查是否存在指定ID的实例
   */
  public has(id: number): boolean {
    return this.instanceMap.has(id);
  }

  /**
   * 添加数据实例
   */
  @action
  public add(data: T): I {
    // 检查是否已存在
    if (this.instanceMap.has(data.levelLogicId)) {
      throw new Error(`Instance with id ${data.levelLogicId} already exists`);
    }

    const instance = this.createInstance(data);
    this.instances.push(instance);
    this.instanceMap.set(data.levelLogicId, instance);
    return instance;
  }

  /**
   * 批量添加数据实例
   */
  @action
  public addBatch(dataList: T[]): I[] {
    const newInstances: I[] = [];
    for (const data of dataList) {
      if (!this.instanceMap.has(data.levelLogicId)) {
        const instance = this.createInstance(data);
        newInstances.push(instance);
        this.instanceMap.set(data.levelLogicId, instance);
      }
    }
    this.instances.push(...newInstances);
    return newInstances;
  }

  /**
   * 移除数据实例
   */
  @action
  public remove(id: number): boolean {
    const instance = this.instanceMap.get(id);
    if (!instance) {
      return false;
    }

    const index = this.instances.indexOf(instance);
    if (index > -1) {
      this.instances.splice(index, 1);
    }
    this.instanceMap.delete(id);
    return true;
  }

  /**
   * 清空所有数据实例
   */
  @action
  public clear(): void {
    this.instances = [];
    this.instanceMap.clear();
  }

  /**
   * 获取已标记的实例
   */
  @computed
  get markedInstances(): I[] {
    return this.instances.filter((instance) => instance.marked);
  }

  /**
   * 获取已标记的数量
   */
  @computed
  get markedCount(): number {
    return this.markedInstances.length;
  }

  /**
   * 获取已选中的实例
   */
  @computed
  get selectedInstances(): I[] {
    return this.instances.filter((instance) => instance.selected);
  }

  /**
   * 获取已选中的数量
   */
  @computed
  get selectedCount(): number {
    return this.selectedInstances.length;
  }

  /**
   * 获取可见的实例
   */
  @computed
  get visibleInstances(): I[] {
    return this.instances.filter((instance) => instance.visible);
  }

  /**
   * 清除所有选中
   */
  @action
  public clearAllSelected(): void {
    for (const instance of this.instances) {
      if (instance.selected) {
        instance.setSelected(false);
      }
    }
  }

  /**
   * 设置所有实例的可见性
   */
  @action
  public setAllVisible(visible: boolean): void {
    for (const instance of this.instances) {
      instance.setVisible(visible);
    }
  }

  /**
   * 根据条件过滤实例
   */
  public filter(predicate: (instance: I) => boolean): I[] {
    return this.instances.filter(predicate);
  }

  /**
   * 根据条件查找单个实例
   */
  public find(predicate: (instance: I) => boolean): I | undefined {
    return this.instances.find(predicate);
  }

  /**
   * 遍历所有实例
   */
  public forEach(callback: (instance: I, index: number) => void): void {
    this.instances.forEach(callback);
  }
}
