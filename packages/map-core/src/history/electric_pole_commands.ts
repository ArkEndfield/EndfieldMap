import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import type { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import type { Command } from '@endfieldmap/map-core/history/command';
import type { ElectricPoleData, MapData } from '@endfieldmap/map-core/types';
import { logger } from '@endfieldmap/tools';
import type { Coordinate } from 'ol/coordinate';

/**
 * 创建电线杆命令
 */
export class CreateElectricPoleCommand implements Command {
  readonly description: string;
  private createdInstance: ElectricPoleDataInstance | null = null;

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapId: MapData['id'],
    private readonly position: Coordinate,
    private readonly deviceKey?: ElectricPoleDeviceKey
  ) {
    this.description = `创建电线杆 at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`;
  }

  execute(): void {
    this.createdInstance = this.controller.createElectricPole(this.mapId, this.position, this.deviceKey);
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
    // 保存删除前的数据用于恢复
    this.deletedData = { ...instance.data } as ElectricPoleData;
    this.outgoingTargetIds = [...instance.outgoingConnectionIds];
    this.incomingSourceIds = instance.incomingConnections.map((p) => p.id);
  }

  execute(): void {
    this.controller.deleteElectricPole(this.mapId, this.instance.id);
  }

  undo(): void {
    if (this.deletedData) {
      // 恢复电线杆
      const manager = this.controller.dataManager.getMapManager(this.mapId);
      const restored = manager.addWithConnection(this.deletedData);

      if (!restored) return;

      // 恢复：由 restored 发出的连线
      for (const targetId of this.outgoingTargetIds) {
        const target = manager.getById(targetId);
        if (target) {
          try {
            restored.connectTo(target);
          } catch (error) {
            logger.warn('[DeleteElectricPoleCommand] Failed to restore outgoing connection', {
              from: restored.id,
              to: targetId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // 恢复：由其他节点发出到 restored 的连线
      for (const sourceId of this.incomingSourceIds) {
        const source = manager.getById(sourceId);
        if (source) {
          try {
            source.connectTo(restored);
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
    private readonly positions: Coordinate[],
    private readonly deviceKey?: ElectricPoleDeviceKey
  ) {
    this.description = `批量创建 ${positions.length} 个电线杆`;
  }

  execute(): void {
    this.createdInstances = [];
    for (const position of this.positions) {
      try {
        const instance = this.controller.createElectricPole(this.mapId, position, this.deviceKey);
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
          data: { ...instance.data } as ElectricPoleData,
          outgoingTargetIds: [...instance.outgoingConnectionIds],
          incomingSourceIds: instance.incomingConnections.map((p) => p.id),
        });
        this.controller.deleteElectricPole(this.mapId, id);
      }
    }
  }

  undo(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapId);

    // 第一阶段：先恢复所有电线杆实例
    const restoredMap = new Map<number, ElectricPoleDataInstance>();
    for (const { data } of this.deletedData) {
      const restored = manager.addWithConnection(data);
      if (restored) {
        restoredMap.set(data.levelLogicId, restored);
      }
    }

    // 第二阶段：恢复所有连接关系（此时所有电线杆都已恢复）
    for (const { data, outgoingTargetIds, incomingSourceIds } of this.deletedData) {
      const restored = restoredMap.get(data.levelLogicId);
      if (!restored) continue;

      for (const targetId of outgoingTargetIds) {
        const target = manager.getById(targetId);
        if (target) {
          try {
            restored.connectTo(target);
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
        const source = manager.getById(sourceId);
        if (source) {
          try {
            source.connectTo(restored);
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
