import type { MapData } from '@endfieldmap/map-core';
import type { PresetSchemaType } from '@endfieldmap/map-service/service/db/export';
import { logger } from '@endfieldmap/tools';
import type { MangoQuerySelector, RxCollection, RxDocument } from 'rxdb';
import type { Subscription } from 'rxjs';

export type NodeSelector<T> = MangoQuerySelector<T>;

type OptionalNodeFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
};

export interface RequiredNodeFields {
  id: string;
  presetId: string;
  mapId: string;
  levelLogicId: number;
  properties: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export interface IPresetService<
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TNodeSchema extends RequiredNodeFields,
> {
  getPresetById(id: string): Promise<TPreset | null>;
  getPresetByIdForExport(id: string): Promise<TPreset | null>;
  createPreset(
    name: string,
    data: TNodeSchema[],
    options?: { id?: string; createdAt?: number; updatedAt?: number }
  ): Promise<TPreset>;
  updatePreset(id: string, updates: { name?: string }): Promise<TPreset>;
  deletePreset(id: string): Promise<void>;
  getAllPresetMetadata(): Promise<PresetSchemaType[]>;

  renameNode(mapId: MapData['id'], presetId: string, levelLogicId: number, newName: string): Promise<void>;
  deleteNode(mapId: MapData['id'], presetId: string, levelLogicId: number): Promise<void>;
  createNode(
    mapId: MapData['id'],
    presetId: string,
    nodeData: Omit<OptionalNodeFields<TNodeSchema>, 'presetId' | 'mapId'>
  ): Promise<TNodeSchema>;
  addNodeSubscribe(
    callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: TNodeSchema, prevData?: TNodeSchema) => void
  ): void;
}

export type NodeSubscribeCallback<TNodeSchema> = (
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  docData: TNodeSchema,
  prevData?: TNodeSchema
) => void;

export type PresetSubscribeCallback = (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: PresetSchemaType) => void;

export abstract class BasePresetService<
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TNodeSchema extends RequiredNodeFields,
> implements IPresetService<TPreset, TNodeSchema>
{
  protected subscriptions: Subscription[] = [];
  protected nodeCallbacks: NodeSubscribeCallback<TNodeSchema>[] = [];
  protected presetCallbacks: PresetSubscribeCallback[] = [];

  public static createId(mapId: string, presetId: string, levelLogicId: number): string {
    return `${mapId}|${presetId}|${levelLogicId}`;
  }

  protected abstract get presetDB(): RxCollection<PresetSchemaType>;
  protected abstract get nodesDB(): RxCollection<TNodeSchema>;

  protected clearSubscriptions(): void {
    for (const sub of this.subscriptions) {
      try {
        sub.unsubscribe();
      } catch (e) {
        logger.warn('[BasePresetService] Failed to unsubscribe', e);
      }
    }
    this.subscriptions = [];
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();

    if (this.nodeCallbacks.length > 0) {
      const nodeSub = this.nodesDB.$.subscribe((changeEvent) => {
        const docData = changeEvent.documentData as TNodeSchema;
        const prevData = changeEvent.previousDocumentData as TNodeSchema | undefined;
        for (const callback of this.nodeCallbacks) {
          try {
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
          } catch (_e) {
            // ignore callback errors
          }
        }
      });
      this.subscriptions.push(nodeSub);
    }

    if (this.presetCallbacks.length > 0) {
      const presetSub = this.presetDB.$.subscribe((changeEvent) => {
        const docData = changeEvent.documentData as PresetSchemaType;
        for (const callback of this.presetCallbacks) {
          try {
            switch (changeEvent.operation) {
              case 'INSERT':
                callback('INSERT', docData);
                break;
              case 'DELETE':
                callback('DELETE', docData);
                break;
              case 'UPDATE':
                callback('UPDATE', docData);
                break;
            }
          } catch (_e) {
            // ignore callback errors
          }
        }
      });
      this.subscriptions.push(presetSub);
    }
  }

  public updateDB(): void {
    logger.info(`[${this.constructor.name}] Updating database connection`);
    this.registerDBSubscriptions();
  }

  public addNodeSubscribe(callback: NodeSubscribeCallback<TNodeSchema>) {
    this.nodeCallbacks.push(callback);
    this.registerDBSubscriptions();
  }

  public addPresetSubscribe(callback: PresetSubscribeCallback) {
    this.presetCallbacks.push(callback);
    this.registerDBSubscriptions();
  }

  public async getPresetById(id: string): Promise<TPreset | null> {
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (!doc) return null;

    const presetData = doc.toJSON() as PresetSchemaType;
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    const data = nodes.map((node) => node.toJSON() as TNodeSchema);

    return {
      ...presetData,
      data,
    } as TPreset;
  }

  public async getAllPresetMetadata(): Promise<PresetSchemaType[]> {
    const docs = await this.presetDB.find().exec();
    return docs.map((doc) => doc.toJSON() as PresetSchemaType);
  }

  public async getPresetByIdForExport(id: string): Promise<TPreset | null> {
    const doc = await this.presetDB.findOne({ selector: { id } }).exec();
    if (!doc) return null;

    const presetData = doc.toJSON() as PresetSchemaType;
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();
    const data = nodes.map((node) => node.toJSON() as TNodeSchema);

    return {
      ...presetData,
      data,
    } as TPreset;
  }

  public async createPreset(
    name: string,
    data: OptionalNodeFields<TNodeSchema>[] = [],
    options?: { id?: string; createdAt?: number; updatedAt?: number }
  ): Promise<TPreset> {
    const now = Date.now();
    const presetId = options?.id ?? this.generatePresetId();
    const createdAt = options?.createdAt ?? now;
    const updatedAt = options?.updatedAt ?? now;

    const presetDoc = await this.presetDB.upsert({
      id: presetId,
      name,
      createdAt,
      updatedAt,
    });

    const insertedData = await this.saveNodesData(presetId, data);

    const presetData = presetDoc.toJSON() as PresetSchemaType;
    return {
      ...presetData,
      data: insertedData.map((node) => node.toJSON() as TNodeSchema),
    } as TPreset;
  }

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

    const presetData = doc.toJSON() as PresetSchemaType;
    const nodes = await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).exec();

    return {
      ...presetData,
      data: nodes.map((node) => node.toJSON() as TNodeSchema),
    } as TPreset;
  }

  public async deletePreset(id: string): Promise<void> {
    await this.nodesDB.find({ selector: { presetId: id } as NodeSelector<TNodeSchema> }).remove();
    await this.presetDB.findOne({ selector: { id } })?.remove();
  }

  protected saveNodesData(presetId: string, data: OptionalNodeFields<TNodeSchema>[]) {
    const insertPromises: Promise<RxDocument<TNodeSchema>>[] = [];

    for (const node of data) {
      const nodeId = BasePresetService.createId(node.mapId, presetId, node.levelLogicId ?? 0);
      insertPromises.push(
        this.nodesDB.upsert({
          ...node,
          id: nodeId,
          presetId,
          createdAt: node?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        } as TNodeSchema)
      );
    }

    return Promise.all(insertPromises);
  }

  protected generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  public async deleteNode(mapId: MapData['id'], presetId: string, levelLogicId: number): Promise<void> {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    await this.nodesDB.findOne({ selector: { id: nodeId } as NodeSelector<TNodeSchema> })?.remove();
  }

  public async createNode(
    mapId: MapData['id'],
    presetId: string,
    nodeData: Omit<OptionalNodeFields<TNodeSchema>, 'presetId' | 'mapId'>
  ): Promise<TNodeSchema> {
    const nodeId = BasePresetService.createId(mapId, presetId, nodeData.levelLogicId);
    const newNode = await this.nodesDB.insert({
      ...nodeData,
      id: nodeId,
      presetId,
      mapId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as TNodeSchema);
    return newNode.toJSON() as TNodeSchema;
  }

  public async renameNode(mapId: MapData['id'], presetId: string, levelLogicId: number, newName: string) {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB.findOne({ selector: { id: nodeId } as NodeSelector<TNodeSchema> }).exec();
    if (!doc) {
      logger.warn(`Node not found for rename: ${nodeId}`);
      return;
    }

    const currentData = doc.toJSON();
    const updatedProperties: Record<string, unknown> = {
      ...currentData.properties,
      name: newName,
    };

    await doc.update({
      $set: { properties: updatedProperties, updatedAt: Date.now() },
    });
  }
}
