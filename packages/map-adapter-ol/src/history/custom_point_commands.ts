import type { CustomPointController } from '@endfieldmap/map-adapter-ol/controller/entity/custom_point_controller';
import type { Command, CustomPointData, CustomPointDataInstance, CustomPointTypeId, MapCoordinate, MapData } from '@endfieldmap/map-core';

/**
 * 创建自定义标点命令
 */
export class CreateCustomPointCommand implements Command {
  readonly description: string;
  private createdInstance: CustomPointDataInstance | null = null;

  constructor(
    private readonly controller: CustomPointController,
    private readonly mapId: MapData['id'],
    private readonly position: MapCoordinate,
    private readonly type: CustomPointTypeId
  ) {
    this.description = `创建自定义标点 (${type}) at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}]`;
  }

  execute(): void {
    this.createdInstance = this.controller.addCustomPointData(this.mapId, this.controller.createCustomPointData(this.mapId, this.position, this.type));
  }

  undo(): void {
    if (this.createdInstance) {
      this.controller.deleteCustomPoint(this.mapId, this.createdInstance.id);
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
    private readonly mapId: MapData['id'],
    private readonly instance: CustomPointDataInstance
  ) {
    this.description = `删除自定义标点 #${instance.id}`;
    this.deletedData = { ...instance.data } as CustomPointData;
  }

  execute(): void {
    this.controller.deleteCustomPoint(this.mapId, this.instance.id);
  }

  undo(): void {
    if (this.deletedData) {
      this.controller.addCustomPointData(this.mapId, this.deletedData);
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
    private readonly mapId: MapData['id'],
    private readonly items: Array<{ position: MapCoordinate; type: CustomPointTypeId }>
  ) {
    this.description = `批量创建 ${items.length} 个自定义标点`;
  }

  execute(): void {
    this.createdInstances = [];
    for (const { position, type } of this.items) {
      const instance = this.controller.addCustomPointData(this.mapId, this.controller.createCustomPointData(this.mapId, position, type));
      if (instance) {
        this.createdInstances.push(instance);
      }
    }
  }

  undo(): void {
    for (const instance of this.createdInstances) {
      this.controller.deleteCustomPoint(this.mapId, instance.id);
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
    private readonly mapId: MapData['id'],
    private readonly ids: number[]
  ) {
    this.description = `批量删除 ${ids.length} 个自定义标点`;
  }

  execute(): void {
    const manager = this.controller.dataManager.getMapManager(this.mapId);

    this.deletedData = [];
    for (const id of this.ids) {
      const instance = manager.getById(id);
      if (instance) {
        this.deletedData.push({ ...instance.data } as CustomPointData);
        this.controller.deleteCustomPoint(this.mapId, id);
      }
    }
  }

  undo(): void {
    for (const data of this.deletedData) {
      this.controller.addCustomPointData(this.mapId, data);
    }
    this.deletedData = [];
  }
}
