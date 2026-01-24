import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_instance';
import { CustomPointMapDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_map_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { CustomPointRender } from '@endfieldmap/map-core/render/renderer/custom_point';
import type { CustomPointMapData, MapData } from '@endfieldmap/map-core/types';
import type { CustomPointData, CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { logger } from '@endfieldmap/tools';
import { action, reaction } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 自定义标点控制器
 * 负责协调CustomPointDataManager和CustomPointRenderer
 */
export class CustomPointController extends Disposer {
  /** 数据管理器 */
  public readonly dataManager: CustomPointMapDataManager;

  /** 渲染器 */
  private render: CustomPointRender;

  constructor() {
    super();
    this.dataManager = new CustomPointMapDataManager();
    this.render = new CustomPointRender(this.dataManager);
    this.initListeners();
  }

  private initListeners() {
    const mapDataManager = MapDataManager.getInstance();
    // mobx 监听 currentMap
    const disposer = reaction(
      () => mapDataManager.currentMapId,
      (mapId) => {
        this.render.render(mapId);
      },
      { fireImmediately: true }
    );
    this.disposers.push(disposer);
  }

  get currentRenderer() {
    return this.render.currentCustomPointInstance;
  }

  // #region 数据操作

  /**
   * 初始化自定义标点数据（重新生成ID）
   */
  @action
  public initCustomPointData(data: CustomPointMapData): void {
    // 全局已使用的ID集合
    const globalUsedIds = new Set<number>();

    // 收集所有现有ID
    for (const [, manager] of this.dataManager.mapManagers) {
      for (const instance of manager.instances) {
        globalUsedIds.add(instance.id);
      }
    }

    // 处理每个地图的数据
    for (const [mapId, list] of Object.entries(data)) {
      const pointList = list as CustomPointData[];

      // 构建旧ID到新ID的映射
      const idMap = new Map<number, number>();

      for (const point of pointList) {
        const oldId = point.levelLogicId;
        const newId = this.generateCustomPointId(globalUsedIds);
        idMap.set(oldId, newId);
        globalUsedIds.add(newId);
      }

      // 重映射数据
      const remappedList: CustomPointData[] = pointList.map((point) => {
        const oldId = point.levelLogicId;
        const newId = idMap.get(oldId)!;

        return {
          ...point,
          levelLogicId: newId,
        };
      });

      // 加载到数据管理器
      this.dataManager.loadMapData(mapId, remappedList);
    }
  }

  /**
   * 加载自定义标点数据（保持原有ID）
   */
  @action
  public loadCustomPointData(data: CustomPointMapData): void {
    for (const [mapId, list] of Object.entries(data)) {
      const pointList = list as CustomPointData[];

      this.dataManager.loadMapData(mapId, pointList);
    }
  }

  /**
   * 创建自定义标点
   */
  @action
  public createCustomPoint(
    mapId: MapData['id'],
    position: Coordinate,
    type: CustomPointTypeId
  ): CustomPointDataInstance | null {
    const mapDataInstance = MapDataManager.getInstance();
    const xyzPosition = mapDataInstance.crd2xyz(position, mapId);
    const manager = this.dataManager.getMapManager(mapId);

    // 生成新ID
    const existingIds = new Set(manager.instances.map((instance) => instance.id));
    const levelLogicId = this.generateCustomPointId(existingIds);

    // 创建数据
    const data: CustomPointData = {
      levelLogicId,
      entityDataIdKey: type,
      templateId: CustomPointKey,
      entityType: '#CustomPoint',
      position: xyzPosition,
      properties: {},
    };

    // 添加到数据管理器
    const instance = manager.add(data);

    return instance;
  }

  /**
   * 添加自定义标点
   */
  @action
  public addCustomPoint(mapId: MapData['id'], data: CustomPointData): CustomPointDataInstance | null {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.add(data);

    return instance;
  }

  /**
   * 删除自定义标点
   */
  @action
  public deleteCustomPoint(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[CustomPointController] Instance not found', { mapId, id });
      return false;
    }

    manager.remove(id);

    return true;
  }

  /**
   * 生成唯一的自定义标点ID
   */
  private generateCustomPointId(usedIds?: Set<number>): number {
    const existingSet = usedIds ?? new Set<number>();

    // 自定义标点ID范围：200,000,000 - 300,000,000
    const MIN_ID = 200_000_000;
    const MAX_ID = 300_000_000;

    return IdGenerator.generate(existingSet, MIN_ID, MAX_ID);
  }

  // #endregion

  // #region 可见性

  /**
   * 设置自定义标点可见性
   */
  @action
  public setCustomPointVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);
    this.render.setVisible(visible);
  }
  // #endregion
}
