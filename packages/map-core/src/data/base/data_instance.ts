import type { DataInstanceConfig, DataInstanceState } from '@endfieldmap/map-core/data/base/types';
import type { MapData } from '@endfieldmap/map-core/types';
import type { BaseEntityData } from '@endfieldmap/map-core/types/entity';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable, toJS } from 'mobx';

/**
 * 数据实例基类
 * 负责管理单个数据项的状态和数据
 * 使用 MobX 装饰器实现响应式
 */
export abstract class BaseDataInstance<T extends BaseEntityData> {
  /** 地图ID */
  public readonly mapId: MapData['id'];

  /** 是否可激活 */
  public readonly activable: boolean = true;
  /** 是否可标记 */
  public readonly markable: boolean = true;
  /** 是否可选择 */
  public readonly selectable: boolean = true;
  /** 是否可以重命名 */
  public readonly renameable: boolean = false;
  /** 是否可以删除 */
  public readonly deletable: boolean = false;

  /** 原始数据 - 深度响应式 */
  @observable.deep
  protected accessor _data: T;

  /** 是否被标记 */
  @observable
  accessor marked: boolean = false;

  /** 是否被选中 */
  @observable
  accessor selected: boolean = false;

  /** 是否激活 */
  @observable
  accessor active: boolean = false;

  /** 是否可见 */
  @observable
  accessor visible: boolean = true;

  constructor(config: DataInstanceConfig<T>) {
    this._data = config.data;
    this.mapId = config.mapId;
  }

  /**
   * 获取唯一ID
   */
  @computed
  get id(): number {
    return this._data.levelLogicId;
  }

  /**
   * 获取原始数据（只读）
   */
  @computed
  get data(): Readonly<T> {
    return toJS(this._data);
  }

  /**
   * 获取位置
   */
  @computed
  get position() {
    return toJS(this._data.position);
  }

  /**
   * 获取实体类型
   */
  @computed
  get entityType(): string {
    return this._data.entityType;
  }

  /**
   * 获取数据ID键
   */
  @computed
  get entityDataIdKey(): string {
    return this._data.entityDataIdKey;
  }

  /**
   * 获取名称
   */
  @computed
  get name(): string {
    return (this._data.properties.name ?? `${this.entityType}#${this.id}`) as string;
  }

  /**
   * 更新状态的通用方法
   */
  @action
  protected updateState(property: keyof DataInstanceState, newValue: boolean): boolean {
    const currentValue = this[property];
    if (currentValue === newValue) {
      return false;
    }

    this[property] = newValue;
    return true;
  }

  /**
   * 设置标记状态
   */
  @action
  public setMarked(marked: boolean): void {
    this.updateState('marked', marked);
  }

  /**
   * 设置选中状态
   */
  @action
  public setSelected(selected: boolean): void {
    this.updateState('selected', selected);
  }

  /**
   * 设置激活状态
   */
  @action
  public setActive(active: boolean): void {
    this.updateState('active', active);
  }

  /**
   * 设置可见状态
   */
  @action
  public setVisible(visible: boolean): void {
    this.updateState('visible', visible);
  }

  /**
   * 重命名
   */
  @action
  public rename(name: string): void {
    if (!this.renameable) {
      logger.error('[EndfieldMap | DataInstance]', 'DataInstance is not renameable', this);
      return;
    }
    this._data.properties.name = name;
  }

  /**
   * 获取当前状态快照
   */
  @computed
  get state(): DataInstanceState {
    return {
      marked: this.marked,
      selected: this.selected,
      active: this.active,
      visible: this.visible,
    };
  }
}
