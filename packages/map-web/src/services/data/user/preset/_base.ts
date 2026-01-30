import type { MapData } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import type { MangoQuerySelector, RxCollection } from 'rxdb';

import type { PresetSchemaType } from '@/services/data/db/schema/preset';

/**
 * 节点查询选择器类型
 * 用于解决 RxDB MangoQuerySelector 的复杂泛型约束
 */
export type NodeSelector<T> = MangoQuerySelector<T>;

/**
 * 节点必需字段接口
 * 定义基类需要访问的字段，确保类型安全
 * 这些字段来自 schema 定义，所有节点 Schema 都必须包含
 */
export interface RequiredNodeFields {
  id: string;
  presetId: string;
  mapId: string;
  levelLogicId: number;
  properties: Record<string, unknown>;
}

/**
 * 预设服务接口
 * TPreset: 预设类型 (必须包含 PresetSchemaType 的所有字段和 data 字段)
 * TNodeSchema: 节点 Schema 类型
 */
export interface IPresetService<
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TNodeSchema extends RequiredNodeFields,
> {
  getAllPresets(): Promise<TPreset[]>;
  getPresetById(id: string): Promise<TPreset | null>;
  getPresetByIdForExport(id: string): Promise<TPreset | null>;
  createPreset(name: string, data: TNodeSchema[]): Promise<TPreset>;
  updatePreset(id: string, updates: { name?: string }): Promise<TPreset>;
  deletePreset(id: string): Promise<void>;

  // 节点操作
  renameNode(mapId: MapData['id'], presetId: string, levelLogicId: number, newName: string): Promise<void>;
  deleteNode(mapId: MapData['id'], presetId: string, levelLogicId: number): Promise<void>;
  createNode(
    mapId: MapData['id'],
    presetId: string,
    nodeData: Omit<TNodeSchema, 'id' | 'presetId' | 'mapId'>
  ): Promise<TNodeSchema>;
  addNodeSubscribe(
    callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: TNodeSchema, prevData?: TNodeSchema) => void
  ): void;
}

/**
 * 预设数据服务基类
 * TPreset: 预设类型 (e.g. ElectricPolePreset, CustomPointPreset) - 必须包含 data: TNodeSchema[]
 * TNodeSchema: 节点 Schema 类型 (e.g. ElectricPoleNodeSchemaType, CustomPointNodeSchemaType) - 从 schema 生成，必须包含 RequiredNodeFields
 */
export abstract class BasePresetService<
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TNodeSchema extends RequiredNodeFields,
> implements IPresetService<TPreset, TNodeSchema>
{
  /**
   * 创建节点 ID
   */
  public static createId(mapId: string, presetId: string, levelLogicId: number): string {
    return `${mapId}|${presetId}|${levelLogicId}`;
  }

  /**
   * 需要子类实现的抽象属性
   */
  protected abstract get presetDB(): RxCollection<PresetSchemaType>;
  protected abstract get nodesDB(): RxCollection<TNodeSchema>;

  public addNodeSubscribe(
    callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: TNodeSchema, prevData?: TNodeSchema) => void
  ) {
    this.nodesDB.$.subscribe((changeEvent) => {
      // changeEvent.documentData 和 previousDocumentData 已经是普通对象 (RxDocumentData)
      const docData = changeEvent.documentData as TNodeSchema;
      const prevData = changeEvent.previousDocumentData as TNodeSchema | undefined;
      switch (changeEvent.operation) {
        case 'INSERT':
          callback('INSERT', docData);
          break;
        case 'DELETE':
          callback('DELETE', docData);
          break;
        case 'UPDATE':
          callback('UPDATE', docData, prevData);
          break;
      }
    });
  }

  /**
   * 获取所有预设列表（包含节点数据）
   */
  public async getAllPresets(): Promise<TPreset[]> {
    const docs = await this.presetDB.find().exec();
    const presets: TPreset[] = [];

    for (const doc of docs) {
      const presetData = doc._data as PresetSchemaType;
      // 查询该预设下的所有节点
      const nodes = await this.nodesDB
        .find({ selector: { presetId: presetData.id } as NodeSelector<TNodeSchema> })
        .exec();
      const data = nodes.map((node) => node._data as TNodeSchema);

      presets.push({
        ...presetData,
        data,
      } as TPreset);
    }

    return presets;
  }

  /**
   * 根据 ID 获取单个预设（包含节点数据）
   */
  public async getPresetById(id: string): Promise<TPreset | null> {
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (!doc) return null;

    const presetData = doc._data as PresetSchemaType;
    // 查询该预设下的所有节点
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    const data = nodes.map((node) => node._data as TNodeSchema);

    return {
      ...presetData,
      data,
    } as TPreset;
  }

  /**
   * 根据 ID 获取单个预设用于导出（使用 toJSON 清理 RxDB 私有字段）
   */
  public async getPresetByIdForExport(id: string): Promise<TPreset | null> {
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (!doc) return null;

    // 使用 toJSON() 自动清理 RxDB 私有字段
    const presetData = doc.toJSON() as PresetSchemaType;
    // 查询该预设下的所有节点
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    const data = nodes.map((node) => node.toJSON() as TNodeSchema);

    return {
      ...presetData,
      data,
    } as TPreset;
  }

  /**
   * 创建新的预设
   */
  public async createPreset(name: string, data: TNodeSchema[] = []): Promise<TPreset> {
    const now = Date.now();
    const presetId = this.generatePresetId();

    // 插入预设元数据
    const presetDoc = await this.presetDB.insert({
      id: presetId,
      name,
      createdAt: now,
      updatedAt: now,
    });

    // 插入节点数据
    await this.saveNodesData(presetId, data);

    const presetData = presetDoc._data as PresetSchemaType;
    return {
      ...presetData,
      data,
    } as TPreset;
  }

  /**
   * 更新预设（名称）
   */
  public async updatePreset(id: string, updates: { name?: string }): Promise<TPreset> {
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (!doc) {
      throw new Error(`Preset not found: ${id}`);
    }

    const now = Date.now();
    const updateFields: Partial<PresetSchemaType> = { updatedAt: now };
    if (updates.name !== undefined) {
      updateFields.name = updates.name;
    }

    await doc.update({ $set: updateFields });

    // 获取更新后的完整数据
    const presetData = doc._data as PresetSchemaType;
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    const data = nodes.map((node) => node._data as TNodeSchema);

    return {
      ...presetData,
      data,
    } as TPreset;
  }

  /**
   * 删除预设及其所有节点
   */
  public async deletePreset(id: string): Promise<void> {
    // 先删除所有节点
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    await Promise.all(nodes.map((node) => node.remove()));

    // 删除预设记录
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (doc) {
      await doc.remove();
    }
  }

  // region: 私有方法
  /**
   * 保存节点数据到数据库
   */
  protected async saveNodesData(presetId: string, data: TNodeSchema[]): Promise<void> {
    const insertPromises: Promise<unknown>[] = [];

    for (const node of data) {
      const nodeId = BasePresetService.createId(node.mapId, presetId, node.levelLogicId ?? 0);
      insertPromises.push(
        this.nodesDB.insert({
          ...node,
          id: nodeId,
          presetId,
        } as TNodeSchema)
      );
    }

    await Promise.all(insertPromises);
  }

  protected generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // endregion

  // region: 节点操作
  public async deleteNode(mapId: MapData['id'], presetId: string, levelLogicId: number): Promise<void> {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB.findOne({ selector: { id: nodeId } as NodeSelector<TNodeSchema> }).exec();
    if (doc) {
      await doc.remove();
    } else {
      logger.warn(`Node not found for deletion: ${nodeId}`);
    }
  }

  public async createNode(
    mapId: MapData['id'],
    presetId: string,
    nodeData: Omit<TNodeSchema, 'id' | 'presetId' | 'mapId'>
  ): Promise<TNodeSchema> {
    const nodeId = BasePresetService.createId(mapId, presetId, nodeData.levelLogicId);
    const newNode = await this.nodesDB.insert({
      ...nodeData,
      id: nodeId,
      presetId,
      mapId,
    } as TNodeSchema);
    return newNode._data as TNodeSchema;
  }

  public async renameNode(mapId: MapData['id'], presetId: string, levelLogicId: number, newName: string) {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB.findOne({ selector: { id: nodeId } as NodeSelector<TNodeSchema> }).exec();
    if (!doc) {
      logger.warn(`Node not found for rename: ${nodeId}`);
      return;
    }

    const currentData = doc._data;
    const updatedProperties: Record<string, unknown> = {
      ...currentData.properties,
      name: newName,
    };

    await doc.update({ $set: { properties: updatedProperties } as Partial<TNodeSchema> });
  }
  // endregion
}
