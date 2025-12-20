import { CustomPointKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import type { CustomPointData, CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point';
import { CustomPointMapDataManager } from '@endfieldmap/map-core/data/custom_point';
import { CustomPointRenderer } from '@endfieldmap/map-core/render/renderer';
import type { CustomPointMapData } from '@endfieldmap/map-core/types';
import type { FeatureMarked, StorageData } from '@endfieldmap/map-core/types/data';
import type { CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { crd2xyz, logger } from '@endfieldmap/tools';
import { action, type IReactionDisposer, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 自定义标点控制器配置
 */
export interface CustomPointControllerConfig {
  /** 初始数据 */
  data?: CustomPointMapData;
  /** 图标配置 */
  icon: {
    /** 图片路径 */
    imagePath: string;
    /** 图标尺寸 */
    size?: number;
  };
}

/**
 * 自定义标点控制器
 * 负责协调CustomPointDataManager和CustomPointRenderer
 */
export class CustomPointController {
  /** 数据管理器 */
  public readonly dataManager: CustomPointMapDataManager;

  /** 图标配置 */
  private readonly iconConfig: CustomPointControllerConfig['icon'];

  /** 渲染器缓存：mapIndex -> renderer */
  private rendererCache: Map<MapIndex, CustomPointRenderer> = new Map();

  /** 当前地图渲染器 */
  @observable
  accessor currentRenderer: CustomPointRenderer | null = null;

  /** 当前图层容器 */
  public layerContainer: CustomPointRenderer | null = null;

  /** 当前地图索引 */
  private currentMapIndex?: MapIndex;

  /** 自定义标点可见性 */
  @observable
  accessor customPointVisible: boolean = true;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  constructor(config: CustomPointControllerConfig) {
    this.iconConfig = config.icon;
    this.dataManager = new CustomPointMapDataManager();

    // 加载初始数据
    if (config.data) {
      this.loadCustomPointData(config.data);
    }
  }

  // #region 地图切换

  /**
   * 获取或创建地图渲染器
   */
  private getOrCreateRenderer(mapIndex: MapIndex): CustomPointRenderer {
    let renderer = this.rendererCache.get(mapIndex);

    if (!renderer) {
      const manager = this.dataManager.getMapManager(mapIndex);

      renderer = new CustomPointRenderer({
        dataManager: manager,
        iconBasePath: this.iconConfig.imagePath,
        iconSize: this.iconConfig.size,
      });

      this.rendererCache.set(mapIndex, renderer);
    }

    // 应用当前可见性设置
    renderer.setVisible(this.customPointVisible);

    return renderer;
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

    const renderer = this.getOrCreateRenderer(mapIndex);

    this.currentRenderer = renderer;
    this.layerContainer = renderer;
  }

  // #endregion

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
    for (const [mapIndexKey, list] of Object.entries(data)) {
      const mapIndex = mapIndexKey as MapIndex;
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
      this.dataManager.loadMapData(mapIndex, remappedList);
    }
  }

  /**
   * 加载自定义标点数据（保持原有ID）
   */
  @action
  public loadCustomPointData(data: CustomPointMapData): void {
    for (const [mapIndexKey, list] of Object.entries(data)) {
      const mapIndex = mapIndexKey as MapIndex;
      const pointList = list as CustomPointData[];

      this.dataManager.loadMapData(mapIndex, pointList);
    }
  }

  /**
   * 创建自定义标点
   */
  @action
  public createCustomPoint(
    mapIndex: MapIndex,
    position: Coordinate,
    type: CustomPointTypeId
  ): CustomPointDataInstance | null {
    const xyzPosition = crd2xyz(position, mapIndex);

    // 确保当前地图已切换
    if (this.currentMapIndex !== mapIndex) {
      logger.warn('[CustomPointController] Creating custom point on non-current map, switching map first');
      this.switchMap(mapIndex);
    }

    const manager = this.dataManager.getMapManager(mapIndex);

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

    // 确保渲染器已经存在并被添加到图层
    if (!this.layerContainer || this.layerContainer !== this.currentRenderer) {
      logger.warn('[CustomPointController] LayerContainer not set, switching map to ensure renderer is added');
      this.switchMap(mapIndex);
    }

    return instance;
  }

  /**
   * 添加自定义标点
   */
  @action
  public addCustomPoint(mapIndex: MapIndex, data: CustomPointData): CustomPointDataInstance | null {
    // 确保渲染器存在
    this.getOrCreateRenderer(mapIndex);

    const manager = this.dataManager.getMapManager(mapIndex);
    const instance = manager.add(data);

    return instance;
  }

  /**
   * 删除自定义标点
   */
  @action
  public deleteCustomPoint(mapIndex: MapIndex, id: number): boolean {
    const manager = this.dataManager.getMapManager(mapIndex);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[CustomPointController] Instance not found', { mapIndex, id });
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
    this.customPointVisible = visible;

    for (const [, renderer] of this.rendererCache) {
      renderer.setVisible(visible);
    }
  }

  /**
   * 切换自定义标点可见性
   */
  public toggleCustomPointVisible(): void {
    this.setCustomPointVisible(!this.customPointVisible);
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
    this.rendererCache.clear();

    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }
}
