import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_instance';
import { CustomPointMapDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_map_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { CustomPointRender } from '@endfieldmap/map-core/render/renderer/entity/custom_point/';
import type { CustomPointMapData, CustomPointNodeData, MapData } from '@endfieldmap/map-core/types';
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
   * 加载自定义标点数据（数组格式）
   * 保持原有ID，确保与数据库中的ID一致
   */
  @action
  public loadCustomPointData(data: CustomPointNodeData[]): void {
    // 先清空所有地图的数据
    this.dataManager.clearAllMaps();

    // 按 mapId 分组
    const groupedData: CustomPointMapData = {};
    for (const node of data) {
      const { mapId, ...pointData } = node;
      if (!groupedData[mapId]) {
        groupedData[mapId] = [];
      }
      groupedData[mapId]!.push(pointData as CustomPointData);
    }

    // 加载到数据管理器，保持原有ID
    for (const [mapId, pointList] of Object.entries(groupedData)) {
      this.dataManager.loadMapData(mapId, pointList as CustomPointData[]);
    }    
  }

  /**
   * 创建自定义标点数据（不添加到管理器）
   */
  public createCustomPointData(
    mapId: MapData['id'],
    position: Coordinate,
    type: CustomPointTypeId
  ): CustomPointData {
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

    return data;
  }

  /**
   * 添加自定义标点数据到管理器
   */
  @action
  public addCustomPointData(mapId: MapData['id'], data: CustomPointData): CustomPointDataInstance {
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

  /**
   * 设置指定类型的可见性
   */
  public setTypeVisible(typeId: string, visible: boolean): void {
    this.dataManager.setTypeVisible(typeId, visible);
  }

  /**
   * 获取指定类型的可见性
   */
  public getTypeVisible(typeId: string): boolean {
    return this.dataManager.getTypeVisible(typeId);
  }

  /**
   * 设置指定地图的指定类型可见性
   */
  public setMapTypeVisible(mapId: MapData['id'], typeId: string, visible: boolean): void {
    this.dataManager.setMapTypeVisible(mapId, typeId, visible);
  }

  /**
   * 导入可见性数据
   */
  public importVisibility(data: { mapId: MapData['id']; entityKey: string; visible: boolean }[]): void {
    this.dataManager.importVisibilityData(data);
  }
  // #endregion
}
