import type { MapData } from '@endfieldmap/map-core';
import type { PresetSchemaType } from '@endfieldmap/map-service/service/db/export';

// Re-export from the canonical location
export type {
  IPresetService,
  NodeSubscribeCallback,
  PresetSubscribeCallback,
  RequiredNodeFields,
} from '@endfieldmap/map-service/service/user/data/preset/_base';

export interface PresetItem {
  id: string;
  name: string;
}

/**
 * 电线杆预设服务接口 (包含 connect/disconnect 方法)
 */
export interface IElectricPolePresetDataService<
  TPreset,
  TNodeSchema extends {
    id: string;
    presetId: string;
    mapId: string;
    levelLogicId: number;
    properties: Record<string, unknown>;
  },
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
    nodeData: Omit<TNodeSchema, 'id' | 'createdAt' | 'updatedAt' | 'mapId' | 'presetId'> & {
      id?: string;
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<TNodeSchema>;
  addNodeSubscribe(
    callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: TNodeSchema, prevData?: TNodeSchema) => void
  ): void;
  connectPoles(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    targetLevelLogicId: number
  ): Promise<TNodeSchema | null>;
  disconnectPoles(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    targetLevelLogicId: number
  ): Promise<TNodeSchema | null>;
  updateNodePosition(
    mapId: MapData['id'],
    presetId: string,
    levelLogicId: number,
    newPosition: { x: number; y: number; z: number }
  ): Promise<TNodeSchema | null>;
  addPresetSubscribe(callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: PresetSchemaType) => void): void;
}

/**
 * 自定义标点预设服务接口 (包含 changeNodeType 方法)
 */
export interface ICustomPointPresetDataService<
  TPreset,
  TNodeSchema extends {
    id: string;
    presetId: string;
    mapId: string;
    levelLogicId: number;
    properties: Record<string, unknown>;
  },
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
    nodeData: Omit<TNodeSchema, 'id' | 'createdAt' | 'updatedAt' | 'mapId' | 'presetId'> & {
      id?: string;
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<TNodeSchema>;
  addNodeSubscribe(
    callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: TNodeSchema, prevData?: TNodeSchema) => void
  ): void;
  changeNodeType(mapId: MapData['id'], presetId: string, levelLogicId: number, newType: string): Promise<void>;
  addPresetSubscribe(callback: (operation: 'INSERT' | 'UPDATE' | 'DELETE', docData: PresetSchemaType) => void): void;
}

/**
 * 可见性服务接口
 */
export interface IVisibilityService {
  getAllMapVisibilityData(): Promise<{ mapId: string; entityKey: string; visible: boolean }[]>;
  setVisibilityData(
    mapId: string,
    entityKey: string,
    visible: boolean
  ): Promise<{ mapId: string; entityKey: string; visible: boolean }>;
  addSubscribe(callback: (mapId: string, entityKey: string, visible: boolean) => void): void;
}

/**
 * 标记服务接口
 */
export interface IEntityMarkService {
  getAllMapMarkData(): Promise<{ mapId: string; entityId: number; marked: boolean }[]>;
  addSubscribe(callback: (mapId: string, id: number, marked: boolean) => void): void;
  setMarkData(mapId: string, id: number, marked: boolean): Promise<unknown>;
}
