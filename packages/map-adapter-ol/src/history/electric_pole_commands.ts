import type { ElectricPoleController } from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import type { Command, ElectricPoleData, ElectricPoleDataInstance, ElectricPoleDeviceKey, MapCoordinate,MapData} from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

/**
 * 创建电线杆命令
 */
export class CreateElectricPoleCommand implements Command {
  readonly description: string;
  private createdInstance: ElectricPoleDataInstance | null = null;

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapId: MapData['id'],
    private readonly position: MapCoordinate,
    private readonly deviceKey?: ElectricPoleDeviceKey
  ) {
    this.description = `创建电线杆 at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`;
  }

  execute(): void {
    this.createdInstance = this.controller.addElectricPoleData(this.mapId, this.controller.createElectricPoleData(this.mapId, this.position, this.deviceKey));
  }

  undo(): void {
    if (this.createdInstance) {
      this.controller.deleteElectricPole(this.mapId, this.createdInstance.id);
      this.createdInstance = null;
    }
  }
}

/**
 * 删除电线杆命令
 */
export class DeleteElectricPoleCommand implements Command {
  readonly description: string;
  private deletedData: ElectricPoleData | null = null;
  private outgoingTargetIds: number[] = [];
  private incomingSourceIds: number[] = [];

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapId: MapData['id'],
    private readonly instance: ElectricPoleDataInstance
  ) {
    this.description = `删除电线杆 #${instance.id}`;
    // 保存删除前的数据用于恢复（properties 必须深拷贝：
    // removeWithCleanup→clearAllConnections→disconnectOutgoingTo 会就地重写共享的 connections 数组）
    this.deletedData = {
      ...instance.data,
      properties: {
        ...instance.data.properties,
        connections: [...(instance.data.properties.connections ?? [])],
      },
    } as ElectricPoleData;
    this.outgoingTargetIds = [...instance.outgoingConnectionIds];
    this.incomingSourceIds = instance.incomingConnections.map((p) => p.id);
  }

  execute(): void {
    this.controller.deleteElectricPole(this.mapId, this.instance.id);
  }

  undo(): void {
    if (!this.deletedData) {
      return;
    }

    // 经 controller 恢复：数据层 addWithConnection（按快照重连出边）+ 渲染层点/zone/连线
    const restored = this.controller.addElectricPoleData(this.mapId, this.deletedData);
    if (!restored) {
      return;
    }

    const manager = this.controller.dataManager.getMapManager(this.mapId);

    // 恢复：由 restored 发出的连线（快照完好的已被 addWithConnection 重连，跳过避免重复告警）
    for (const targetId of this.outgoingTargetIds) {
      if (restored.isConnectedTo(targetId)) {
        continue;
      }
      const target = manager.getById(targetId);
      if (target) {
        try {
          this.controller.connectElectricPoles(this.mapId, restored.id, targetId);
        } catch (error) {
          logger.warn('[DeleteElectricPoleCommand] Failed to restore outgoing connection', {
            from: restored.id,
            to: targetId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // 恢复：由其他节点发出到 restored 的连线（删除时来源杆的 connections 已被摘除本杆 id，必须显式重连）
    for (const sourceId of this.incomingSourceIds) {
      if (restored.isConnectedTo(sourceId)) {
        continue;
      }
      const source = manager.getById(sourceId);
      if (source) {
        try {
          this.controller.connectElectricPoles(this.mapId, sourceId, restored.id);
        } catch (error) {
          logger.warn('[DeleteElectricPoleCommand] Failed to restore incoming connection', {
            from: sourceId,
            to: restored.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}

/**
 * 批量创建电线杆命令
 */
export class BatchCreateElectricPolesCommand implements Command {
  readonly description: string;
  private createdInstances: ElectricPoleDataInstance[] = [];

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapId: MapData['id'],
    private readonly positions: MapCoordinate[],
    private readonly deviceKey?: ElectricPoleDeviceKey
  ) {
    this.description = `批量创建 ${positions.length} 个电线杆`;
  }

  execute(): void {
    this.createdInstances = [];
    for (const position of this.positions) {
      try {
        const instance = this.controller.addElectricPoleData(this.mapId, this.controller.createElectricPoleData(this.mapId, position, this.deviceKey));
        if (instance) {
          this.createdInstances.push(instance);
        }
      } catch (error) {
        // 忽略重复位置等错误，但记录日志
        logger.debug('[BatchCreateElectricPolesCommand] Failed to create pole at position', {
          position,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  undo(): void {
    for (const instance of this.createdInstances) {
      this.controller.deleteElectricPole(this.mapId, instance.id);
    }
    this.createdInstances = [];
  }
}

/**
 * 批量删除电线杆命令
 */
export class BatchDeleteElectricPolesCommand implements Command {
  readonly description: string;
  private deletedData: Array<{
    data: ElectricPoleData;
    outgoingTargetIds: number[];
    incomingSourceIds: number[];
  }> = [];

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapId: MapData['id'],
    private readonly ids: number[]
  ) {
    this.description = `批量删除 ${ids.length} 个电线杆`;
  }

  execute(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapId);

    this.deletedData = [];
    for (const id of this.ids) {
      const instance = manager.getById(id);
      if (instance) {
        this.deletedData.push({
          // properties 深拷贝：clearAllConnections 会就地重写共享的 connections 数组
          data: {
            ...instance.data,
            properties: {
              ...instance.data.properties,
              connections: [...(instance.data.properties.connections ?? [])],
            },
          } as ElectricPoleData,
          outgoingTargetIds: [...instance.outgoingConnectionIds],
          incomingSourceIds: instance.incomingConnections.map((p) => p.id),
        });
        this.controller.deleteElectricPole(this.mapId, id);
      }
    }
  }

  undo(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapId);

    // 第一阶段：先恢复所有电线杆实例（数据层 addWithConnection 重连出边 + 渲染层点/zone/连线）
    const restoredMap = new Map<number, ElectricPoleDataInstance>();
    for (const { data } of this.deletedData) {
      const restored = this.controller.addElectricPoleData(this.mapId, data);
      if (restored) {
        restoredMap.set(data.levelLogicId, restored);
      }
    }

    // 第二阶段：恢复所有连接关系（此时所有电线杆都已恢复）
    for (const { data, outgoingTargetIds, incomingSourceIds } of this.deletedData) {
      const restored = restoredMap.get(data.levelLogicId);
      if (!restored) continue;

      for (const targetId of outgoingTargetIds) {
        if (restored.isConnectedTo(targetId)) {
          continue;
        }
        const target = manager.getById(targetId);
        if (target) {
          try {
            this.controller.connectElectricPoles(this.mapId, restored.id, targetId);
          } catch (error) {
            logger.warn('[BatchDeleteElectricPolesCommand] Failed to restore outgoing connection', {
              from: restored.id,
              to: targetId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      for (const sourceId of incomingSourceIds) {
        if (restored.isConnectedTo(sourceId)) {
          continue;
        }
        const source = manager.getById(sourceId);
        if (source) {
          try {
            this.controller.connectElectricPoles(this.mapId, sourceId, restored.id);
          } catch (error) {
            logger.warn('[BatchDeleteElectricPolesCommand] Failed to restore incoming connection', {
              from: sourceId,
              to: restored.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }
    this.deletedData = [];
  }
}
