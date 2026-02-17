import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import type { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_instance';
import { CustomPointMapDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_map_data_manager';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { CustomPointRender } from '@endfieldmap/map-core/render/renderer/entity/custom_point/';
import type { CustomPointFeatureData } from '@endfieldmap/map-core/render/renderer/entity/custom_point/custom_point_renderer';
import type { CustomPointMapData, CustomPointNodeData, MapData } from '@endfieldmap/map-core/types';
import type { CustomPointData, CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { logger } from '@endfieldmap/tools';
import { action, reaction } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export interface CustomPointControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: EndfieldMapAsset;
}

/**
 * 自定义标点控制器
 * 负责协调 CustomPointDataManager 和 CustomPointRenderer
 *
 * 设计原则：
 * - Controller 是数据与渲染的唯一协调者
 * - 所有数据变更通过 Controller 路由
 * - 渲染器通过 Controller 显式调用更新
 */
export class CustomPointController extends Disposer {
  /** 数据管理器 */
  public readonly dataManager: CustomPointMapDataManager;

  /** 渲染器 */
  public render: CustomPointRender;

  private mapDataManager: MapDataManager;
  private asset: EndfieldMapAsset;
  private mapInstance: EndfieldMap;

  constructor(config: CustomPointControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.mapInstance = config.mapInstance;
    this.asset = config.asset;
    this.dataManager = new CustomPointMapDataManager(config.mapDataManager);
    this.render = new CustomPointRender({
      mapInstance: config.mapInstance,
      mapIds: config.mapDataManager.mapIds,
      asset: config.asset,
    });
    this.initListeners();
  }

  private initListeners() {
    // mobx 监听 currentMap 切换
    const disposer = reaction(
      () => this.mapDataManager.currentMapId,
      (mapId) => {
        this.render.switchMap(mapId);
      },
      { fireImmediately: true }
    );
    this.disposers.push(disposer);
  }

  get currentRenderer() {
    return this.render.currentRenderer;
  }

  // #region 数据加载

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

    // 初始化渲染器
    this.initializeRenderers();

    // 切换到当前地图
    this.render.switchMap(this.mapDataManager.currentMapId);
  }

  /**
   * 初始化所有渲染器
   */
  private initializeRenderers(): void {
    const imagePath = this.asset.entityImage;
    const mapIds = Array.from(this.dataManager.mapManagers.keys());

    // 重建 render
    this.render.dispose();
    this.render = new CustomPointRender({
      mapInstance: this.mapInstance,
      mapIds,
      asset: this.asset,
    });

    for (const mapId of mapIds) {
      const manager = this.dataManager.getMapManager(mapId);

      // 按 typeId 分组
      const instancesByType = new Map<string, CustomPointDataInstance[]>();
      for (const instance of manager.instances) {
        const typeId = instance.typeId;
        if (!instancesByType.has(typeId)) {
          instancesByType.set(typeId, []);
        }
        instancesByType.get(typeId)!.push(instance);
      }

      // 为每种类型创建渲染器
      for (const [typeId, instances] of instancesByType) {
        const iconName = instances[0].iconName;
        const typeVisible = this.dataManager.getTypeVisible(typeId);

        const renderer = this.render.createRenderer(mapId, typeId, {
          iconPath: `${imagePath}/${iconName}.png`,
          initialVisible: typeVisible,
        });

        // 生成 FeatureData 并批量添加
        const featureDataList: CustomPointFeatureData[] = instances.map((instance) => ({
          id: instance.id,
          coordinates: instance.coordinates,
          dataInstance: instance,
          visible: instance.visible,
          active: instance.active,
        }));

        renderer.addFeatures(featureDataList);
      }
    }
  }

  // #endregion

  // #region 数据操作

  /**
   * 创建自定义标点数据（不添加到管理器）
   */
  public createCustomPointData(mapId: MapData['id'], position: Coordinate, type: CustomPointTypeId): CustomPointData {
    const xyzPosition = this.mapDataManager.crd2xyz(position, mapId);
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
   * 添加自定义标点数据到管理器，同时同步渲染器
   */
  @action
  public addCustomPointData(mapId: MapData['id'], data: CustomPointData): CustomPointDataInstance {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.add(data);

    // 同步渲染器：确保该类型的渲染器存在
    const typeId = instance.typeId;
    let renderer = this.render.getRenderer(mapId, typeId);
    if (!renderer) {
      const imagePath = this.asset.entityImage;
      renderer = this.render.createRenderer(mapId, typeId, {
        iconPath: `${imagePath}/${instance.iconName}.png`,
        initialVisible: this.dataManager.getTypeVisible(typeId),
      });

      // 如果当前地图是该地图，添加图层
      if (this.mapDataManager.currentMapId === mapId) {
        this.render.switchMap(mapId);
      }
    }

    renderer.addFeatures([
      {
        id: instance.id,
        coordinates: instance.coordinates,
        dataInstance: instance,
        visible: instance.visible,
        active: instance.active,
      },
    ]);

    return instance;
  }

  /**
   * 删除自定义标点，同时同步渲染器
   */
  @action
  public deleteCustomPoint(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[CustomPointController] Instance not found', { mapId, id });
      return false;
    }

    const typeId = instance.typeId;

    // 从数据管理器移除
    manager.remove(id);

    // 从渲染器移除
    const renderer = this.render.getRenderer(mapId, typeId);
    if (renderer) {
      renderer.removeFeatures([id]);
    }

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
   * 设置自定义标点整体可见性
   */
  @action
  public setCustomPointVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);

    // 同步所有渲染器的图层可见性
    const currentMapId = this.mapDataManager.currentMapId;
    const renderers = this.render.getRenderers(currentMapId);
    for (const renderer of renderers) {
      renderer.setVisible(visible);
    }
  }

  /**
   * 设置指定类型的可见性
   * 同时更新数据和渲染
   */
  public setTypeVisible(typeId: string, visible: boolean): void {
    this.dataManager.setTypeVisible(typeId, visible);

    // 同步渲染器：设置该类型所有地图的渲染器可见性
    for (const mapId of this.dataManager.mapManagers.keys()) {
      this.render.setGroupVisible(mapId, typeId, visible);
    }
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

    // 同步渲染器
    this.render.setGroupVisible(mapId, typeId, visible);
  }

  /**
   * 导入可见性数据
   */
  public importVisibility(data: { mapId: MapData['id']; entityKey: string; visible: boolean }[]): void {
    this.dataManager.importVisibilityData(data);

    // 同步渲染器
    for (const item of data) {
      this.render.setGroupVisible(item.mapId, item.entityKey, item.visible);
    }
  }
  // #endregion
}
