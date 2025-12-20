import { electricPoleEntityInfo } from '@endfieldmap/map-core/const/entity';
import { ElectricPoleIdKey, ElectricPoleKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleData, ElectricPoleDataInstance, ElectricPoleMapData } from '@endfieldmap/map-core/data/electric_pole';
import { ElectricPoleMapDataManager } from '@endfieldmap/map-core/data/electric_pole';
import { MultiLayerContainer } from '@endfieldmap/map-core/render/layers/multi_layer_container';
import { ElectricPoleRenderer, ElectricPoleZoneRenderer } from '@endfieldmap/map-core/render/renderer';
import type { FeatureMarked, StorageData } from '@endfieldmap/map-core/types/data';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { calculateXYZDistance, crd2xyz, logger } from '@endfieldmap/tools';
import { action, type IReactionDisposer,observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 电线杆控制器配置
 */
export interface ElectricPoleControllerConfig {
  /** 图片路径 */
  imagePath: string;
}

/**
 * 电线杆控制器
 * 负责协调ElectricPoleDataManager和ElectricPoleRenderer
 */
export class ElectricPoleController {
  /** 数据管理器 */
  public readonly dataManager: ElectricPoleMapDataManager;

  /** 图片路径 */
  private readonly imagePath: string;

  /** 渲染器缓存：mapIndex -> renderer */
  private rendererCache: Map<MapIndex, ElectricPoleRenderer> = new Map();

  /** Zone渲染器缓存：mapIndex -> renderer */
  private zoneRendererCache: Map<MapIndex, ElectricPoleZoneRenderer> = new Map();

  /** 当前地图渲染器 */
  @observable
  accessor currentRenderer: ElectricPoleRenderer | null = null;

  /** 当前zone渲染器 */
  @observable
  accessor currentZoneRenderer: ElectricPoleZoneRenderer | null = null;

  /** 当前图层容器 */
  public layerContainer: MultiLayerContainer | null = null;

  /** 当前地图索引 */
  private currentMapIndex?: MapIndex;

  /** Zone可见性 */
  @observable
  accessor zoneVisible: boolean = true;

  /** 电线杆整体可见性 */
  @observable
  accessor electricPoleVisible: boolean = true;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  constructor(config: ElectricPoleControllerConfig) {
    this.imagePath = config.imagePath;
    this.dataManager = new ElectricPoleMapDataManager();
  }

  // #region 地图切换

  /**
   * 获取或创建地图渲染器
   */
  private getOrCreateRenderers(mapIndex: MapIndex): {
    renderer: ElectricPoleRenderer;
    zoneRenderer: ElectricPoleZoneRenderer;
  } {
    let renderer = this.rendererCache.get(mapIndex);
    let zoneRenderer = this.zoneRendererCache.get(mapIndex);

    if (!renderer) {
      const manager = this.dataManager.getMapManager(mapIndex);

      renderer = new ElectricPoleRenderer({
        dataManager: manager,
        iconPath: `${this.imagePath}/${electricPoleEntityInfo.entityInfo.pic}.png`,
        iconSize: 52,
      });

      this.rendererCache.set(mapIndex, renderer);
    }

    if (!zoneRenderer) {
      const manager = this.dataManager.getMapManager(mapIndex);

      zoneRenderer = new ElectricPoleZoneRenderer({
        dataManager: manager,
      });

      this.zoneRendererCache.set(mapIndex, zoneRenderer);
    }

    // 应用当前可见性设置
    renderer.setVisible(this.electricPoleVisible);
    zoneRenderer.setVisible(this.zoneVisible && this.electricPoleVisible);

    return { renderer, zoneRenderer };
  }

  /**
   * 切换地图
   */
  @action
  public switchMap(mapIndex: MapIndex): void {
    if (this.currentMapIndex === mapIndex) {
      return;
    }

    this.currentMapIndex = mapIndex;
    this.dataManager.switchMap(mapIndex);

    const { renderer, zoneRenderer } = this.getOrCreateRenderers(mapIndex);

    this.currentRenderer = renderer;
    this.currentZoneRenderer = zoneRenderer;

    // 创建图层容器：zone在底层，连线在中层，实体在顶层
    this.layerContainer = new MultiLayerContainer([zoneRenderer.layer, renderer.connectionLayer, renderer.entityLayer]);
  }

  // #endregion

  // #region 数据操作

  /**
   * 初始化电线杆数据（重新生成ID）
   */
  @action
  public initElectricPoleData(data: ElectricPoleMapData): void {
    // 全局已使用的ID集合
    const globalUsedIds = new Set<number>();

    // 收集所有现有ID
    for (const [, manager] of this.dataManager.mapManagers) {
      for (const instance of manager.instances) {
        globalUsedIds.add(instance.id);
      }
    }

    // 处理每个地图的数据
    for (const [mapIndexKey, list] of Object.entries(data)) {
      const mapIndex = mapIndexKey as MapIndex;
      const poleList = list as ElectricPoleData[];

      // 构建旧ID到新ID的映射
      const idMap = new Map<number, number>();

      for (const pole of poleList) {
        const oldId = pole.levelLogicId;
        const newId = this.generateLevelLogicId(globalUsedIds);
        idMap.set(oldId, newId);
        globalUsedIds.add(newId);
      }

      // 重映射数据
      const remappedList: ElectricPoleData[] = poleList.map((pole) => {
        const oldId = pole.levelLogicId;
        const newId = idMap.get(oldId)!;

        let newConnectTo: number | null = null;
        if (pole.properties.connectTo != null) {
          const mapped = idMap.get(pole.properties.connectTo);
          if (mapped != null) {
            newConnectTo = mapped;
          } else {
            logger.warn('[ElectricPoleController] connectTo target not found after remap', {
              mapIndex,
              from: oldId,
              to: pole.properties.connectTo,
            });
          }
        }

        return {
          ...pole,
          levelLogicId: newId,
          properties: {
            ...pole.properties,
            connectTo: newConnectTo,
          },
        };
      });

      // 加载到数据管理器
      this.dataManager.loadMapData(mapIndex, remappedList);

      // 同步连接关系
      this.syncConnectionsForMap(mapIndex);
    }
  }

  /**
   * 加载电线杆数据（保持原有ID）
   */
  @action
  public loadElectricPoleData(data: ElectricPoleMapData): void {
    for (const [mapIndexKey, list] of Object.entries(data)) {
      const mapIndex = mapIndexKey as MapIndex;
      const poleList = list as ElectricPoleData[];

      this.dataManager.loadMapData(mapIndex, poleList);
      this.syncConnectionsForMap(mapIndex);
    }
  }

  /**
   * 重置所有电线杆数据
   */
  @action
  public resetAllElectricPoleData(data: ElectricPoleMapData): void {
    // 清空现有渲染器
    for (const [, renderer] of this.rendererCache) {
      renderer.dispose();
    }
    for (const [, renderer] of this.zoneRendererCache) {
      renderer.dispose();
    }
    this.rendererCache.clear();
    this.zoneRendererCache.clear();

    // 清空数据管理器
    this.dataManager.clearAll();

    this.layerContainer = null;
    this.currentMapIndex = undefined;
    this.currentRenderer = null;
    this.currentZoneRenderer = null;

    // 直接加载数据
    this.loadElectricPoleData(data);
  }

  /**
   * 同步指定地图的连接关系
   */
  private syncConnectionsForMap(mapIndex: MapIndex): void {
    const manager = this.dataManager.getMapManager(mapIndex);

    for (const instance of manager.instances) {
      const connectToId = instance.data.properties.connectTo;
      if (connectToId != null) {
        const targetInstance = manager.getById(connectToId);
        if (targetInstance) {
          instance.connectionTo = targetInstance;
          targetInstance.setConnectionFrom(instance);
        } else {
          logger.warn('[ElectricPoleController] Connection target not found', {
            mapIndex,
            from: instance.id,
            to: connectToId,
          });
        }
      }
    }
  }

  /**
   * 创建电线杆
   */
  @action
  public createElectricPole(mapIndex: MapIndex, position: Coordinate): ElectricPoleDataInstance | null {
    const xyzPosition = crd2xyz(position, mapIndex);

    // 检查是否存在重复（0.5 单位内认为是重复点击）
    const manager = this.dataManager.getMapManager(mapIndex);
    const duplicateRadius = 0.5;

    for (const instance of manager.instances) {
      const distance = calculateXYZDistance(xyzPosition, instance.position);
      if (distance < duplicateRadius) {
        throw new Error(`[ElectricPoleController] Duplicate electric pole at ${position} (distance: ${distance})`);
      }
    }

    // 生成新ID
    const existingIds = new Set(manager.instances.map((instance) => instance.id));
    const levelLogicId = this.generateLevelLogicId(existingIds);

    // 创建数据
    const data: ElectricPoleData = {
      levelLogicId,
      entityDataIdKey: ElectricPoleIdKey,
      templateId: ElectricPoleKey,
      entityType: '#ElectricPole',
      position: xyzPosition,
      properties: {
        connectTo: null,
      },
    };

    // 添加到数据管理器
    const instance = manager.addWithConnection(data);

    return instance;
  }

  /**
   * 删除电线杆
   */
  @action
  public deleteElectricPole(mapIndex: MapIndex, id: number): boolean {
    const manager = this.dataManager.getMapManager(mapIndex);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[ElectricPoleController] Instance not found', { mapIndex, id });
      return false;
    }

    // 清理连接关系
    instance.clearConnectionTo();
    instance.clearConnectionFrom();

    // 从管理器中移除
    manager.remove(id);

    return true;
  }

  /**
   * 生成唯一的逻辑ID
   */
  private generateLevelLogicId(usedIds?: Set<number>): number {
    const existingSet = usedIds ?? new Set<number>();

    // 电线杆ID范围：100,000,000 - 200,000,000
    const MIN_ID = 100_000_000;
    const MAX_ID = 200_000_000;

    return IdGenerator.generate(existingSet, MIN_ID, MAX_ID);
  }

  // #endregion

  // #region 可见性

  /**
   * 设置zone可见性
   */
  @action
  public setZoneVisible(visible: boolean): void {
    this.zoneVisible = visible;

    for (const [, renderer] of this.zoneRendererCache) {
      renderer.setVisible(visible && this.electricPoleVisible);
    }
  }

  /**
   * 切换zone可见性
   */
  public toggleZoneVisible(): void {
    this.setZoneVisible(!this.zoneVisible);
  }

  /**
   * 设置电线杆整体可见性
   */
  @action
  public setElectricPoleVisible(visible: boolean): void {
    this.electricPoleVisible = visible;

    for (const [, renderer] of this.rendererCache) {
      renderer.setVisible(visible);
    }

    for (const [, renderer] of this.zoneRendererCache) {
      renderer.setVisible(visible && this.zoneVisible);
    }
  }

  /**
   * 切换电线杆可见性
   */
  public toggleElectricPoleVisible(): void {
    this.setElectricPoleVisible(!this.electricPoleVisible);
  }

  // #endregion

  // #region 数据导入导出

  /**
   * 导出标记数据
   */
  public exportMarked(): StorageData<FeatureMarked> {
    return this.dataManager.exportMarkedData();
  }

  /**
   * 导入标记数据
   */
  public importMarked(data: StorageData<FeatureMarked>): number {
    const fullData: Record<MapIndex, Record<number, boolean>> = {} as Record<MapIndex, Record<number, boolean>>;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        fullData[key as MapIndex] = value;
      }
    }
    return this.dataManager.importMarkedData(fullData);
  }

  // #endregion

  /**
   * 销毁控制器
   */
  public dispose(): void {
    for (const [, renderer] of this.rendererCache) {
      renderer.dispose();
    }
    for (const [, renderer] of this.zoneRendererCache) {
      renderer.dispose();
    }
    this.rendererCache.clear();
    this.zoneRendererCache.clear();

    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }
}
