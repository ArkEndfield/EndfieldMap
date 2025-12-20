import { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import { getCustomPointEntityInfo, isValidCustomPointType } from '@endfieldmap/map-core/data/custom_point/custom_point_config';
import type { EntityInfo } from '@endfieldmap/map-core/data/entity';
import type {
  CustomPointData,
  CustomPointDataInstanceConfig,
  CustomPointTypeId,
} from '@endfieldmap/map-core/types/entity';
import { xyz2crd } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 自定义标点数据实例
 * 负责管理单个自定义标点的数据和状态
 */
export class CustomPointDataInstance extends BaseDataInstance<CustomPointData> {
  /** Entity信息 - 根据类型动态获取 */
  @observable
  private accessor _entityInfo: EntityInfo;

  /** 是否可标记（自定义标点不支持标记） */
  public readonly markable: boolean = false;
  /** 是否可选择 */
  public readonly selectable: boolean = false;

  constructor(config: CustomPointDataInstanceConfig) {
    super({
      data: config.data,
      mapIndex: config.mapIndex,
    });
    this._entityInfo = config.entityInfo;
  }

  /**
   * 获取Entity信息
   */
  @computed
  get entityInfo(): EntityInfo {
    return this._entityInfo;
  }

  /**
   * 获取坐标
   */
  @computed
  get coordinates(): Coordinate {
    return xyz2crd(this._data.position, this.mapIndex);
  }

  /**
   * 获取类型ID
   */
  @computed
  get typeId(): CustomPointTypeId {
    const id = this._data.entityDataIdKey;
    
    // 如果没有类型ID，返回默认值
    if (!id) {
      return 'custom_point_1'; // 返回默认类型
    }
    
    return id;
  }

  /**
   * 获取图标名称
   */
  @computed
  get iconName(): string {
    return this._entityInfo.entityInfo.pic;
  }

  /**
   * 更改标点类型
   */
  @action
  public changeType(typeId: CustomPointTypeId): void {
    if (!isValidCustomPointType(typeId)) {
      throw new Error(`Invalid custom point type: ${typeId}`);
    }

    this._data.entityDataIdKey = typeId;
    this._entityInfo = getCustomPointEntityInfo(typeId);
  }

  /**
   * 更改标点类型 (别名，用于兼容)
   */
  @action
  public changePointType(typeId: CustomPointTypeId): void {
    this.changeType(typeId);
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
    return this._data.properties.name ?? `CustomPoint #${this.id}`;
  }

  /**
   * 禁用标记功能
   */
  @action
  public setMarked(_marked: boolean): void {
    // 自定义标点不支持标记
  }

  /**
   * 禁用选中功能
   */
  @action
  public setSelected(_selected: boolean): void {
    // 自定义标点不支持选中
  }
}
