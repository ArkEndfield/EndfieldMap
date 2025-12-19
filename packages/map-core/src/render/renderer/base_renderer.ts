import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import type { EntityData } from '@endfieldmap/map-core/types/entity';
import { type IReactionDisposer,reaction } from 'mobx';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';

/**
 * 渲染器基类配置
 */
export interface BaseRendererConfig {
  /** 地图索引 */
  mapIndex: MapIndex;
}

/**
 * 渲染器基类
 * 负责将数据实例渲染到OpenLayers图层
 * 监听数据变化并更新渲染
 */
export abstract class BaseRenderer<
  D extends BaseDataInstance<R>,
  R extends EntityData,
> {
  /** 地图索引 */
  public readonly mapIndex: MapIndex;

  /** 图层实例 */
  public abstract readonly layer: VectorLayer;

  /** 数据源 */
  protected abstract readonly source: VectorSource;

  /** MobX reaction disposers */
  protected disposers: IReactionDisposer[] = [];

  constructor(config: BaseRendererConfig) {
    this.mapIndex = config.mapIndex;
  }

  /**
   * 设置数据实例的状态变化监听
   */
  protected setupDataReaction(dataInstance: D, onChange: () => void): IReactionDisposer {
    return reaction(
      () => ({
        marked: dataInstance.marked,
        selected: dataInstance.selected,
        active: dataInstance.active,
        visible: dataInstance.visible,
      }),
      () => {
        onChange();
      }
    );
  }

  /**
   * 设置图层可见性
   */
  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
  }

  /**
   * 获取图层可见性
   */
  public getVisible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
    this.source.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    // 清理所有reactions
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }
}
