import type { DevToolsFeatureData } from '@endfieldmap/map-adapter-ol/types/dev_tools';
import type { Command } from '@endfieldmap/map-core';

/**
 * DevTools Controller 接口（用于命令引用）
 */
export interface DevToolsControllerInterface {
  addFeatureInternal(data: DevToolsFeatureData): void;
  removeFeatureInternal(id: number): DevToolsFeatureData | null;
  syncFeaturesInternal(features: DevToolsFeatureData[]): void;
  getAllFeatureData(): DevToolsFeatureData[];
  setFeatureVisibleInternal(id: number, visible: boolean): boolean;
  getFeatureVisible(id: number): boolean;
}

/**
 * 添加 DevTools Feature 命令
 */
export class AddDevToolsFeatureCommand implements Command {
  readonly description: string;
  private featureData: DevToolsFeatureData;

  constructor(
    private readonly controller: DevToolsControllerInterface,
    data: DevToolsFeatureData
  ) {
    this.featureData = data;
    this.description = `添加 DevTools 图形 #${data.id} (${data.type})`;
  }

  execute(): void {
    this.controller.addFeatureInternal(this.featureData);
  }

  undo(): void {
    this.controller.removeFeatureInternal(this.featureData.id);
  }
}

/**
 * 移除 DevTools Feature 命令
 */
export class RemoveDevToolsFeatureCommand implements Command {
  readonly description: string;
  private removedData: DevToolsFeatureData | null = null;

  constructor(
    private readonly controller: DevToolsControllerInterface,
    private readonly featureId: number
  ) {
    this.description = `移除 DevTools 图形 #${featureId}`;
  }

  execute(): void {
    this.removedData = this.controller.removeFeatureInternal(this.featureId);
  }

  undo(): void {
    if (this.removedData) {
      this.controller.addFeatureInternal(this.removedData);
    }
  }
}

/**
 * 清空 DevTools Features 命令
 */
export class ClearDevToolsFeaturesCommand implements Command {
  readonly description = '清空所有 DevTools 图形';
  private previousFeatures: DevToolsFeatureData[] = [];

  constructor(private readonly controller: DevToolsControllerInterface) {}

  execute(): void {
    this.previousFeatures = this.controller.getAllFeatureData();
    this.controller.syncFeaturesInternal([]);
  }

  undo(): void {
    this.controller.syncFeaturesInternal(this.previousFeatures);
  }
}

/**
 * 批量添加 DevTools Features 命令
 */
export class BatchAddDevToolsFeaturesCommand implements Command {
  readonly description: string;

  constructor(
    private readonly controller: DevToolsControllerInterface,
    private readonly features: DevToolsFeatureData[]
  ) {
    this.description = `批量添加 ${features.length} 个 DevTools 图形`;
  }

  execute(): void {
    for (const data of this.features) {
      this.controller.addFeatureInternal(data);
    }
  }

  undo(): void {
    for (const data of this.features) {
      this.controller.removeFeatureInternal(data.id);
    }
  }
}

/**
 * 批量移除 DevTools Features 命令
 */
export class BatchRemoveDevToolsFeaturesCommand implements Command {
  readonly description: string;
  private removedFeatures: DevToolsFeatureData[] = [];

  constructor(
    private readonly controller: DevToolsControllerInterface,
    private readonly featureIds: number[]
  ) {
    this.description = `批量移除 ${featureIds.length} 个 DevTools 图形`;
  }

  execute(): void {
    this.removedFeatures = [];
    for (const id of this.featureIds) {
      const data = this.controller.removeFeatureInternal(id);
      if (data) {
        this.removedFeatures.push(data);
      }
    }
  }

  undo(): void {
    for (const data of this.removedFeatures) {
      this.controller.addFeatureInternal(data);
    }
  }
}

/**
 * 设置 DevTools Feature 可见性命令
 */
export class SetDevToolsFeatureVisibilityCommand implements Command {
  readonly description: string;
  private previousVisible: boolean;

  constructor(
    private readonly controller: DevToolsControllerInterface,
    private readonly featureId: number,
    private readonly visible: boolean
  ) {
    this.previousVisible = controller.getFeatureVisible(featureId);
    this.description = `设置 DevTools 图形 #${featureId} 可见性: ${visible ? '显示' : '隐藏'}`;
  }

  execute(): void {
    this.controller.setFeatureVisibleInternal(this.featureId, this.visible);
  }

  undo(): void {
    this.controller.setFeatureVisibleInternal(this.featureId, this.previousVisible);
  }
}
