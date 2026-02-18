import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import type { JSONLoader } from '@endfieldmap/tools';

import { LoadingStageId } from '@/const/loading';
import { CustomPointDataService } from '@/services/data/map/custom_point';
import { ElectricPoleDataService } from '@/services/data/map/electric_pole';
import { EntityDataService } from '@/services/data/map/entity';
import { GridTiersDataService } from '@/services/data/map/grid_tiers';
import { MapStateDataService } from '@/services/data/map/map_state';
import { loadingManager } from '@/services/loading';

/**
 * 数据服务
 */
export class MapDataService {
  private readonly jsonLoader: JSONLoader;
  public static instance?: MapDataService;

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public mapStateDataService: MapStateDataService;
  public gridTiersDataService: GridTiersDataService;

  constructor(adapter: EndfieldMapAdapter, jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
    this.entityDataService = new EntityDataService(adapter);
    this.electricPoleDataService = new ElectricPoleDataService(adapter);
    this.customPointDataService = new CustomPointDataService(adapter);

    this.mapStateDataService = new MapStateDataService(adapter);
    this.gridTiersDataService = new GridTiersDataService(this.jsonLoader, adapter);
  }

  public static async createInstance(adapter: EndfieldMapAdapter, jsonLoader: JSONLoader) {
    if (MapDataService.instance) return MapDataService.instance;
    const instance = new MapDataService(adapter, jsonLoader);
    await instance.init();
    return instance;
  }

  public async init() {
    // 所有初始化任务
    const initTasks = [
      // 初始化 entity 数据
      () => this.entityDataService.initFromStorage(),
      // 初始化电线杆预设数据
      () => this.electricPoleDataService.initFromStorage(),
      // 初始化自定义标点预设数据
      () => this.customPointDataService.initFromStorage(),
      // 初始化网格分级数据
      () => this.gridTiersDataService.init(),
    ];

    const totalTasks = initTasks.length;
    let completedTasks = 0;

    // 创建带进度追踪的 promise
    const trackedPromises = initTasks.map((task) =>
      task().then((result) => {
        completedTasks++;
        // MAP_RENDER 阶段，进度从 10% 到 90%（留 10% 给收尾）
        const progress = 10 + (completedTasks / totalTasks) * 80;
        loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, progress);
        return result;
      })
    );

    await Promise.all(trackedPromises);
  }

  /**
   * 停止所有操作
   * TODO: 更新补充
   */
  public stopAllOperation() {
    this.customPointDataService.stopAllOperation();
    this.electricPoleDataService.stopAllOperation();
  }
}
