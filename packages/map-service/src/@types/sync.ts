/**
 * 同步状态枚举
 */
export enum SyncStatus {
  /** 空闲 - 同步已完成或未开始 */
  Idle = 'idle',
  /** 同步中 - 正在与服务器同步数据 */
  Syncing = 'syncing',
  /** 错误 - 同步过程中发生错误 */
  Error = 'error',
  /** 离线 - 无网络连接 */
  Offline = 'offline',
}

/**
 * 同步检查点
 * 用于增量同步，记录上次同步的位置
 */
export interface SyncCheckpoint {
  updated_at: number;
  id: string;
}

/**
 * 同步文档状态
 * 后端返回的文档格式
 */
export interface SyncDocumentState {
  scope?: string;
  id: string;
  updated_at: number;
  deleted: boolean;
  fields: Record<string, unknown>;
}

/**
 * 拉取响应
 */
export interface PullResponse {
  documents: SyncDocumentState[];
  checkpoint: SyncCheckpoint | null;
}

/**
 * 推送请求中的单个文档
 */
export interface PushDocumentRow {
  assumed_master_state: SyncDocumentState | null;
  new_fork_state: SyncDocumentState;
}

/**
 * 推送响应
 */
export interface PushResponse {
  conflicts: SyncDocumentState[];
}

/**
 * 支持同步的 Collection 名称
 */
export type SyncCollectionName =
  'custom_point_node' | 'custom_point_preset' | 'electric_pole_node' | 'electric_pole_preset' | 'entity_mark';

/**
 * RxDB Collection 名称到后端 Collection 名称的映射
 */
export const RXDB_TO_BACKEND_COLLECTION: Record<string, SyncCollectionName> = {
  customPointNode: 'custom_point_node',
  customPointPreset: 'custom_point_preset',
  electricPoleNode: 'electric_pole_node',
  electricPolePreset: 'electric_pole_preset',
  entityMark: 'entity_mark',
};
