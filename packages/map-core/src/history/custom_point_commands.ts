import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import type { CustomPointData, CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point';
import type { Command } from '@endfieldmap/map-core/history/command';
import type { CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import type { Coordinate } from 'ol/coordinate';

/**
 * 创建自定义标点命令
 */
export class CreateCustomPointCommand implements Command {
  readonly description: string;
  private createdInstance: CustomPointDataInstance | null = null;

  constructor(
    private readonly controller: CustomPointController,
    private readonly mapIndex: MapIndex,
    private readonly position: Coordinate,
    private readonly type: CustomPointTypeId
  ) {
    this.description = `创建自定义标点 (${type}) at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`;
  }

  execute(): void {
    this.createdInstance = this.controller.createCustomPoint(this.mapIndex, this.position, this.type);
  }

  undo(): void {
    if (this.createdInstance) {
      this.controller.deleteCustomPoint(this.mapIndex, this.createdInstance.id);
      this.createdInstance = null;
    }
  }
}

/**
 * 删除自定义标点命令
 */
export class DeleteCustomPointCommand implements Command {
  readonly description: string;
  private deletedData: CustomPointData | null = null;

  constructor(
    private readonly controller: CustomPointController,
    private readonly mapIndex: MapIndex,
    private readonly instance: CustomPointDataInstance
  ) {
    this.description = `删除自定义标点 #${instance.id}`;
    this.deletedData = { ...instance.data } as CustomPointData;
  }

  execute(): void {
    this.controller.deleteCustomPoint(this.mapIndex, this.instance.id);
  }

  undo(): void {
    if (this.deletedData) {
      this.controller.addCustomPoint(this.mapIndex, this.deletedData);
    }
  }
}

/**
 * 批量创建自定义标点命令
 */
export class BatchCreateCustomPointsCommand implements Command {
  readonly description: string;
  private createdInstances: CustomPointDataInstance[] = [];

  constructor(
    private readonly controller: CustomPointController,
    private readonly mapIndex: MapIndex,
    private readonly items: Array<{ position: Coordinate; type: CustomPointTypeId }>
  ) {
    this.description = `批量创建 ${items.length} 个自定义标点`;
  }

  execute(): void {
    this.createdInstances = [];
    for (const { position, type } of this.items) {
      const instance = this.controller.createCustomPoint(this.mapIndex, position, type);
      if (instance) {
        this.createdInstances.push(instance);
      }
    }
  }

  undo(): void {
    for (const instance of this.createdInstances) {
      this.controller.deleteCustomPoint(this.mapIndex, instance.id);
    }
    this.createdInstances = [];
  }
}

/**
 * 批量删除自定义标点命令
 */
export class BatchDeleteCustomPointsCommand implements Command {
  readonly description: string;
  private deletedData: CustomPointData[] = [];

  constructor(
    private readonly controller: CustomPointController,
    private readonly mapIndex: MapIndex,
    private readonly ids: number[]
  ) {
    this.description = `批量删除 ${ids.length} 个自定义标点`;
  }

  execute(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapIndex);

    this.deletedData = [];
    for (const id of this.ids) {
      const instance = manager.getById(id);
      if (instance) {
        this.deletedData.push({ ...instance.data } as CustomPointData);
        this.controller.deleteCustomPoint(this.mapIndex, id);
      }
    }
  }

  undo(): void {
    for (const data of this.deletedData) {
      this.controller.addCustomPoint(this.mapIndex, data);
    }
    this.deletedData = [];
  }
}
