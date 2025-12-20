import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import type { ElectricPoleData, ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole';
import type { Command } from '@endfieldmap/map-core/history/command';
import type { Coordinate } from 'ol/coordinate';

/**
 * 创建电线杆命令
 */
export class CreateElectricPoleCommand implements Command {
  readonly description: string;
  private createdInstance: ElectricPoleDataInstance | null = null;

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapIndex: MapIndex,
    private readonly position: Coordinate
  ) {
    this.description = `创建电线杆 at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`;
  }

  execute(): void {
    this.createdInstance = this.controller.createElectricPole(this.mapIndex, this.position);
  }

  undo(): void {
    if (this.createdInstance) {
      this.controller.deleteElectricPole(this.mapIndex, this.createdInstance.id);
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
  private connectionToId: number | null = null;

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapIndex: MapIndex,
    private readonly instance: ElectricPoleDataInstance
  ) {
    this.description = `删除电线杆 #${instance.id}`;
    // 保存删除前的数据用于恢复
    this.deletedData = { ...instance.data } as ElectricPoleData;
    this.connectionToId = instance.connectionTo?.id ?? null;
  }

  execute(): void {
    this.controller.deleteElectricPole(this.mapIndex, this.instance.id);
  }

  undo(): void {
    if (this.deletedData) {
      // 恢复电线杆
      const manager = this.controller.dataManager.getMapManager(this.mapIndex);
      const restored = manager.addWithConnection(this.deletedData);

      // 恢复连接关系
      if (this.connectionToId !== null && restored) {
        const target = manager.getById(this.connectionToId);
        if (target) {
          restored.connectTo(target);
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
    private readonly mapIndex: MapIndex,
    private readonly positions: Coordinate[]
  ) {
    this.description = `批量创建 ${positions.length} 个电线杆`;
  }

  execute(): void {
    this.createdInstances = [];
    for (const position of this.positions) {
      try {
        const instance = this.controller.createElectricPole(this.mapIndex, position);
        if (instance) {
          this.createdInstances.push(instance);
        }
      } catch {
        // 忽略重复位置错误
      }
    }
  }

  undo(): void {
    for (const instance of this.createdInstances) {
      this.controller.deleteElectricPole(this.mapIndex, instance.id);
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
    connectionToId: number | null;
  }> = [];

  constructor(
    private readonly controller: ElectricPoleController,
    private readonly mapIndex: MapIndex,
    private readonly ids: number[]
  ) {
    this.description = `批量删除 ${ids.length} 个电线杆`;
  }

  execute(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapIndex);

    this.deletedData = [];
    for (const id of this.ids) {
      const instance = manager.getById(id);
      if (instance) {
        this.deletedData.push({
          data: { ...instance.data } as ElectricPoleData,
          connectionToId: instance.connectionTo?.id ?? null,
        });
        this.controller.deleteElectricPole(this.mapIndex, id);
      }
    }
  }

  undo(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapIndex);

    for (const { data, connectionToId } of this.deletedData) {
      const restored = manager.addWithConnection(data);
      if (connectionToId !== null && restored) {
        const target = manager.getById(connectionToId);
        if (target) {
          restored.connectTo(target);
        }
      }
    }
    this.deletedData = [];
  }
}
