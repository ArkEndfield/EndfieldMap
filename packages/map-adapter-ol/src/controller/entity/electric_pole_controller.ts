import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { ElectricPoleRender } from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole';
import type { ElectricPoleFeatureData } from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole/electric_pole_renderer';
import type { ZoneData } from '@endfieldmap/map-adapter-ol/render/renderer/entity/electric_pole/electric_pole_zone_renderer';
import type { ElectricPoleData, ElectricPoleDataInstance, ElectricPoleDeviceKey,ElectricPoleMapData, ElectricPoleNodeData, EndfieldMapAsset, MapData, MapDataManager } from '@endfieldmap/map-core';
import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  Disposer,
  ElectricPoleIdKey,
  ElectricPoleKey,
  ElectricPoleMapDataManager,
  getElectricPoleDeviceConfig,
  IdGenerator
} from '@endfieldmap/map-core';
import { calculateDistance, calculateXYZDistance, logger } from '@endfieldmap/tools';
import { action, reaction } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export interface ElectricPoleControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: EndfieldMapAsset;
}

/**
 * 电线杆控制器
 * 负责协调 ElectricPoleDataManager 和 ElectricPoleRenderer
 *
 * 设计原则：
 * - Controller 是数据与渲染的唯一协调者
 * - 所有数据变更通过 Controller 路由
 * - 渲染器通过 Controller 显式调用更新
 */
export class ElectricPoleController extends Disposer {
  /** 数据管理器 */
  public readonly dataManager: ElectricPoleMapDataManager;

  /** 渲染器缓存 */
  public render: ElectricPoleRender;

  private mapDataManager: MapDataManager;
  private asset: EndfieldMapAsset;
  private mapInstance: EndfieldMap;

  constructor(config: ElectricPoleControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.mapInstance = config.mapInstance;
    this.asset = config.asset;
    this.dataManager = new ElectricPoleMapDataManager(config.mapDataManager);
    this.render = new ElectricPoleRender({
      mapInstance: config.mapInstance,
      mapIds: config.mapDataManager.mapIds,
      entityImagePath: config.asset.entityImage,
    });
    this.initListeners();
  }

  private initListeners() {
    // mobx 监听 currentMap
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
    return this.render.currentElectricPoleInstance.pole;
  }

  get currentZoneRenderer() {
    return this.render.currentElectricPoleInstance.zone;
  }

  /**
   * 设置当前 hover 的电线杆（用于高亮该杆关联的连线与 zone）
   * 由 adapter 监听 HOVER_FEATURE_CHANGE 后，若 newFeature 为电线杆则调用
   */
  public setHoveredPole(instance: ElectricPoleDataInstance | null): void {
    this.render.setHoveredPoleId(instance ? instance.id : null);
  }

  // #region 数据操作

  /**
   * 加载电线杆数据（数组格式）
   * 每条数据需包含 mapId 字段
   */
  @action
  public loadElectricPoleData(data: ElectricPoleNodeData[]): void {
    // 先清空所有地图的数据
    this.dataManager.clearAllMaps();
    // 按 mapId 分组
    const groupedData: ElectricPoleMapData = {};
    for (const node of data) {
      const { mapId, ...poleData } = node;
      if (!groupedData[mapId]) {
        groupedData[mapId] = [];
      }
      groupedData[mapId]!.push(poleData as ElectricPoleData);
    }

    // 加载分组后的数据
    for (const [mapId, list] of Object.entries(groupedData)) {
      const poleList = list as ElectricPoleData[];
      this.dataManager.loadMapData(mapId, poleList);
      this.syncConnectionsForMap(mapId);
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
    this.render = new ElectricPoleRender({
      mapInstance: this.mapInstance,
      mapIds,
      entityImagePath: imagePath,
    });

    for (const mapId of mapIds) {
      const manager = this.dataManager.getMapManager(mapId);

      // 按 deviceKey 分组
      const instancesByDevice = new Map<string, ElectricPoleDataInstance[]>();
      for (const instance of manager.instances) {
        const deviceKey = instance.deviceKey;
        if (!instancesByDevice.has(deviceKey)) {
          instancesByDevice.set(deviceKey, []);
        }
        instancesByDevice.get(deviceKey)!.push(instance);
      }

      // 为每种设备类型创建渲染器
      for (const [deviceKey, instances] of instancesByDevice) {
        const config = getElectricPoleDeviceConfig(deviceKey as ElectricPoleDeviceKey);
        const deviceVisible = this.dataManager.getDeviceVisible(deviceKey as ElectricPoleDeviceKey);

        const renderers = this.render.createRenderer(mapId, deviceKey, {
          iconPath: `${imagePath}/${config.iconPic}.png`,
          initialVisible: deviceVisible && this.dataManager.visible,
          zoneVisible: this.dataManager.zoneVisible && deviceVisible && this.dataManager.visible,
        });

        // 生成 FeatureData 并批量添加
        const featureDataList: ElectricPoleFeatureData[] = instances.map((instance) => ({
          id: instance.id,
          coordinates: instance.coordinates,
          dataInstance: instance,
          visible: instance.visible,
          active: instance.active,
        }));
        renderers.pole.addFeatures(featureDataList);

        // 生成 ZoneData 并批量添加
        const zoneDataList: ZoneData[] = instances.map((instance) => ({
          id: instance.id,
          coordinates: instance.coordinates,
          radius: instance.zoneRadius,
          dataInstance: instance,
          visible: instance.visible,
        }));
        renderers.zone.addZones(zoneDataList);

        // 添加连线（只有当起点和终点都可见时才添加）
        for (const instance of instances) {
          for (const target of instance.outgoingConnections) {
            if (instance.visible && target.visible) {
              renderers.pole.addConnection({
                fromInstance: instance,
                fromCoordinates: instance.coordinates,
                targetId: target.id,
                targetCoordinates: target.coordinates,
              });
            }
          }
        }
      }
    }
  }

  /**
   * 同步指定地图的连接关系
   */
  private syncConnectionsForMap(mapId: MapData['id']): void {
    const manager = this.dataManager.getMapManager(mapId);
    manager.syncAllConnections();
  }

  /**
   * 创建电线杆数据
   */
  public createElectricPoleData(
    mapId: MapData['id'],
    position: Coordinate,
    deviceKey: ElectricPoleDeviceKey = DEFAULT_ELECTRIC_POLE_DEVICE_KEY
  ): ElectricPoleData {
    const crd: [number, number] = [position[0], position[1]];
    const xyzPosition = this.mapDataManager.crd2xyz(crd, mapId);

    // 检查是否存在重复（0.5 单位内认为是重复点击）
    const manager = this.dataManager.getMapManager(mapId);
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

    const createLimit = getElectricPoleDeviceConfig(deviceKey).createLimit;
    if (typeof createLimit === 'number' && Number.isFinite(createLimit)) {
      const count = manager.instances.filter((i) => i.deviceKey === deviceKey).length;
      if (count >= createLimit) {
        throw new Error(
          `[ElectricPoleController] Create limit reached for deviceKey=${deviceKey} (limit: ${createLimit})`
        );
      }
    }

    // 创建数据
    const data: ElectricPoleData = {
      levelLogicId,
      entityDataIdKey: ElectricPoleIdKey,
      templateId: ElectricPoleKey,
      entityType: '#ElectricPole',
      position: xyzPosition,
      properties: {
        deviceKey,
        connections: [],
      },
    };

    return data;
  }

  /**
   * 将电线杆数据添加到管理器中，同时同步渲染器
   */
  @action
  public addElectricPoleData(mapId: MapData['id'], data: ElectricPoleData): ElectricPoleDataInstance {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.addWithConnection(data);
    const deviceKey = instance.deviceKey;

    // 确保渲染器存在
    let renderers = this.render.getRenderer(mapId, deviceKey);
    if (!renderers) {
      const config = getElectricPoleDeviceConfig(deviceKey);
      const imagePath = this.asset.entityImage;
      renderers = this.render.createRenderer(mapId, deviceKey, {
        iconPath: `${imagePath}/${config.iconPic}.png`,
        initialVisible: this.dataManager.visible,
        zoneVisible: this.dataManager.zoneVisible && this.dataManager.visible,
      });

      if (this.mapDataManager.currentMapId === mapId) {
        this.render.switchMap(mapId);
      }
    }

    // 添加点 feature
    renderers.pole.addFeatures([
      {
        id: instance.id,
        coordinates: instance.coordinates,
        dataInstance: instance,
        visible: instance.visible,
        active: instance.active,
      },
    ]);

    // 添加 zone（新建时从半径 0 做展开动画）
    renderers.zone.addZones(
      [
        {
          id: instance.id,
          coordinates: instance.coordinates,
          radius: instance.zoneRadius,
          dataInstance: instance,
          visible: instance.visible,
        },
      ],
      { animate: true }
    );

    // 添加连线（outgoing，从发出点到连接点伸展动画）
    for (const target of instance.outgoingConnections) {
      if (instance.visible && target.visible) {
        renderers.pole.addConnection(
          {
            fromInstance: instance,
            fromCoordinates: instance.coordinates,
            targetId: target.id,
            targetCoordinates: target.coordinates,
          },
          { animate: true }
        );
      }
    }

    // 添加反向连线（incoming）
    for (const source of instance.incomingConnections) {
      const sourceRenderers = this.render.getRenderer(mapId, source.deviceKey);
      if (sourceRenderers && source.visible && instance.visible) {
        sourceRenderers.pole.addConnection(
          {
            fromInstance: source,
            fromCoordinates: source.coordinates,
            targetId: instance.id,
            targetCoordinates: instance.coordinates,
          },
          { animate: true }
        );
      }
    }

    return instance;
  }

  /**
   * 建立两个电线杆之间的连接（数据 + 渲染同步）
   */
  @action
  public connectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void {
    const manager = this.dataManager.getMapManager(mapId);
    const fromInstance = manager.getById(fromId);
    const toInstance = manager.getById(toId);

    if (!fromInstance || !toInstance) {
      logger.error('[ElectricPoleController] Instance not found for connection', { mapId, fromId, toId });
      return;
    }

    // 数据层：建立连接
    fromInstance.connectTo(toInstance);

    // 渲染层：添加连线（从发出点到连接点伸展动画）
    const renderers = this.render.getRenderer(mapId, fromInstance.deviceKey);
    if (renderers && fromInstance.visible && toInstance.visible) {
      renderers.pole.addConnection(
        {
          fromInstance,
          fromCoordinates: fromInstance.coordinates,
          targetId: toInstance.id,
          targetCoordinates: toInstance.coordinates,
        },
        { animate: true }
      );
    }
  }

  /**
   * 断开两个电线杆之间的连接（数据 + 渲染同步）
   */
  @action
  public disconnectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void {
    const manager = this.dataManager.getMapManager(mapId);
    const fromInstance = manager.getById(fromId);

    if (!fromInstance) {
      logger.error('[ElectricPoleController] Instance not found for disconnection', { mapId, fromId, toId });
      return;
    }

    // 数据层：断开连接
    fromInstance.disconnectOutgoingTo(toId);

    // 渲染层：移除连线（先收缩到起点再移除）
    const renderers = this.render.getRenderer(mapId, fromInstance.deviceKey);
    if (renderers) {
      renderers.pole.removeConnection(fromId, toId, { animate: true });
    }
  }

  /**
   * 删除电线杆，同时同步渲染器
   */
  @action
  public deleteElectricPole(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[ElectricPoleController] Instance not found', { mapId, id });
      return false;
    }

    const deviceKey = instance.deviceKey;

    // 从数据管理器移除（含清理连接关系）
    const result = manager.removeWithCleanup(id);

    // 从渲染器移除：点立即移除，连线收缩动画后移除，zone 收缩动画后移除
    const renderers = this.render.getRenderer(mapId, deviceKey);
    if (renderers) {
      renderers.pole.removeFeatures([id], { animateConnections: true });
      renderers.zone.removeZones([id], { animate: true });
    }

    return result;
  }

  /**
   * 移动电线杆到新位置（含重复检测、连线距离校验，并同步渲染）
   */
  @action
  public updateElectricPolePosition(
    mapId: MapData['id'],
    instanceId: number,
    newCoordinate: Coordinate
  ): void {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.getById(instanceId);
    if (!instance) {
      logger.error('[ElectricPoleController] Instance not found for move', { mapId, instanceId });
      return;
    }

    const crd: [number, number] = [newCoordinate[0], newCoordinate[1]];
    const xyzPosition = this.mapDataManager.crd2xyz(crd, mapId);

    // 重复检测：与其它电线杆距离至少 0.5（排除自身）
    const duplicateRadius = 0.5;
    for (const other of manager.instances) {
      if (other.id === instanceId) continue;
      const distance = calculateXYZDistance(xyzPosition, other.position);
      if (distance < duplicateRadius) {
        throw new Error(
          `[ElectricPoleController] Move would create duplicate electric pole (distance: ${distance})`
        );
      }
    }

    // 连线距离校验：移动后与所有已连接杆的距离须在各自 zone 内
    for (const other of instance.connectedPoles) {
      const distance = calculateDistance(newCoordinate as [number, number], other.coordinates);
      if (distance > instance.zoneRadius) {
        throw new Error(
          `[ElectricPoleController] Move would exceed zone radius to pole ${other.id} (distance: ${distance}, limit: ${instance.zoneRadius})`
        );
      }
      if (distance > other.zoneRadius) {
        throw new Error(
          `[ElectricPoleController] Move would exceed target pole zone radius (distance: ${distance}, limit: ${other.zoneRadius})`
        );
      }
    }

    instance.updatePosition(xyzPosition);

    const deviceKey = instance.deviceKey;
    const renderers = this.render.getRenderer(mapId, deviceKey);
    if (renderers) {
      renderers.pole.updateFeatureCoordinates(instanceId, instance.coordinates);
      renderers.zone.updateZoneGeometry(instanceId, instance.coordinates, instance.zoneRadius);

      for (const target of instance.outgoingConnections) {
        renderers.pole.updateConnection(
          instance.id,
          target.id,
          instance.coordinates,
          target.coordinates
        );
      }
      for (const source of instance.incomingConnections) {
        renderers.pole.updateConnection(
          source.id,
          instance.id,
          source.coordinates,
          instance.coordinates
        );
      }
    }
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
  public setZoneVisible(visible: boolean): void {
    this.dataManager.setZoneVisible(visible);

    this.render.setZoneVisible(visible && this.dataManager.visible);
  }

  /**
   * 设置电线杆整体可见性
   */
  public setVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);

    this.render.setVisible(visible);

    // 同步 zone 可见性
    this.render.setZoneVisible(this.dataManager.zoneVisible && visible);
  }

  /**
   * 设置指定设备类型的可见性
   */
  public setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setDeviceVisible(deviceKey, visible);

    // 同步渲染器：需要同步所有地图中该设备类型的渲染
    for (const [mapId] of this.dataManager.mapManagers) {
      this.syncDeviceVisibilityToRenderer(mapId, deviceKey, visible);
    }
  }

  /**
   * 设置指定地图的指定设备类型的可见性
   */
  public setMapDeviceVisible(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setMapDeviceVisible(mapId, deviceKey, visible);

    // 同步渲染器
    this.syncDeviceVisibilityToRenderer(mapId, deviceKey, visible);
  }

  /**
   * 获取指定设备类型的可见性
   */
  public getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean {
    return this.dataManager.getDeviceVisible(deviceKey);
  }

  /**
   * 导入可见性数据
   */
  public importVisibility(data: { mapId: MapData['id']; entityKey: string; visible: boolean }[]): void {
    this.dataManager.importVisibilityData(data);

    // 同步渲染器
    for (const item of data) {
      this.syncDeviceVisibilityToRenderer(item.mapId, item.entityKey, item.visible);
    }
  }

  /**
   * 同步设备可见性到渲染器
   * 当设备类型的可见性变化时，需要：
   * 1. 更新图层可见性
   * 2. 更新每个 feature 的 visible 状态
   * 3. 更新连线和 zone 的可见性
   */
  private syncDeviceVisibilityToRenderer(mapId: MapData['id'], deviceKey: string, visible: boolean): void {
    const renderers = this.render.getRenderer(mapId, deviceKey);
    if (!renderers) return;

    // 1. 设置图层整体可见性
    renderers.pole.setVisible(visible);
    renderers.zone.setVisible(visible);

    // 2. 更新每个 feature 的 visible 属性（供 WebGL 表达式使用）
    const manager = this.dataManager.getMapManager(mapId);
    const instances = manager.instances.filter((i) => i.deviceKey === deviceKey);

    for (const instance of instances) {
      // 更新点 feature 的可见性
      renderers.pole.updateFeatureState(instance.id, {
        visible: instance.visible,
      });

      // 更新 zone 的可见性
      renderers.zone.updateZoneVisibility(instance.id, instance.visible, instance.coordinates, instance.zoneRadius);

      // 更新连线：移除旧连线，根据新的可见性重新添加
      for (const target of instance.outgoingConnections) {
        renderers.pole.removeConnection(instance.id, target.id);
        if (instance.visible && target.visible) {
          renderers.pole.addConnection({
            fromInstance: instance,
            fromCoordinates: instance.coordinates,
            targetId: target.id,
            targetCoordinates: target.coordinates,
          });
        }
      }
    }
  }

  // #endregion
}
