import { logger } from '@endfieldmap/tools';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxCollection, WithDeleted } from 'rxdb';

import { DataService } from '@/services/data';
import { serverService } from '@/services/server';
import { alert } from '@/components/common/alert/alert_api';
import {
  SyncStatus,
  RXDB_TO_BACKEND_COLLECTION,
  type SyncCheckpoint,
  type SyncDocumentState,
  type SyncCollectionName,
} from '@eftypes/sync';

/** 同步文档类型，包含 _deleted 标记 */
type SyncDocument = WithDeleted<Record<string, unknown>>;

// 需要同步的 RxDB collection 名称
const SYNC_COLLECTION_NAMES = [
  'customPointNode',
  'customPointPreset',
  'electricPoleNode',
  'electricPolePreset',
  'entityMark',
] as const;

type SyncCollectionKey = (typeof SYNC_COLLECTION_NAMES)[number];

/**
 * 将 RxDB 文档转换为后端文档格式
 */
function toBackendDoc(doc: Record<string, unknown>): SyncDocumentState {
  const { id, updatedAt, ...rest } = doc;
  // 检查是否有 _deleted 标记
  const deleted = (doc as { _deleted?: boolean })._deleted === true;

  return {
    id: id as string,
    updated_at: (updatedAt as number) || Date.now(),
    deleted,
    fields: rest as Record<string, unknown>,
  };
}

/**
 * 将后端文档格式转换为 RxDB 文档（带 _deleted 标记）
 */
function fromBackendDoc(backendDoc: SyncDocumentState): SyncDocument {
  return {
    id: backendDoc.id,
    updatedAt: backendDoc.updated_at,
    _deleted: backendDoc.deleted,
    ...backendDoc.fields,
  };
}

/**
 * 数据同步服务
 * 使用 RxDB replication 协议实现与服务器的数据同步
 */
export class SyncService {
  /** 当前同步状态 */
  @observable.ref
  accessor status: SyncStatus = SyncStatus.Idle;

  /** 上次同步错误信息 */
  @observable.ref
  accessor lastError: string | null = null;

  /** 上次同步时间 */
  @observable.ref
  accessor lastSyncTime: number | null = null;

  /** 当前活跃的复制状态 */
  private replicationStates: Map<SyncCollectionKey, RxReplicationState<SyncDocument, SyncCheckpoint>> = new Map();

  /** 是否正在同步 */
  private isSyncing: boolean = false;

  /** 连续错误计数器 */
  private consecutiveErrorCount: number = 0;

  /** 最大连续错误次数 */
  private static readonly MAX_CONSECUTIVE_ERRORS = 5;

  constructor() {
    makeObservable(this);
  }

  /**
   * 是否正在同步中
   */
  @computed
  get isSyncingStatus(): boolean {
    return this.status === SyncStatus.Syncing;
  }

  /**
   * 是否处于错误状态
   */
  @computed
  get isError(): boolean {
    return this.status === SyncStatus.Error;
  }

  /**
   * 启动数据同步
   * 为所有支持的 collection 创建 replication
   */
  public async startSync(): Promise<void> {
    if (this.isSyncing) {
      logger.warn('[SyncService] Sync already running, stopping first...');
      await this.stopSync();
    }

    logger.info('[SyncService] Starting sync...');
    this.isSyncing = true;

    runInAction(() => {
      this.status = SyncStatus.Syncing;
      this.lastError = null;
    });

    try {
      const db = DataService.dbStorage.database;

      // 为每个 collection 创建 replication
      for (const collectionName of SYNC_COLLECTION_NAMES) {
        const collection = db[collectionName] as RxCollection<unknown>;
        if (!collection) {
          logger.warn(`[SyncService] Collection ${collectionName} not found, skipping...`);
          continue;
        }

        const backendCollectionName = RXDB_TO_BACKEND_COLLECTION[collectionName];
        if (!backendCollectionName) {
          logger.warn(`[SyncService] No backend mapping for ${collectionName}, skipping...`);
          continue;
        }

        const replicationState = this.createReplication(collection, backendCollectionName, collectionName);
        this.replicationStates.set(collectionName, replicationState);
      }

      runInAction(() => {
        this.status = SyncStatus.Idle;
        this.lastSyncTime = Date.now();
      });

      logger.info('[SyncService] Sync started successfully');
    } catch (error) {
      logger.error('[SyncService] Failed to start sync:', error);
      runInAction(() => {
        this.status = SyncStatus.Error;
        this.lastError = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }

  /**
   * 停止数据同步
   * @param keepErrorState 是否保持当前错误状态（因错误停止时设为 true）
   */
  public async stopSync(keepErrorState: boolean = false): Promise<void> {
    logger.info('[SyncService] Stopping sync...');

    // 取消所有复制状态
    const cancelPromises: Promise<void>[] = [];
    for (const [name, replicationState] of this.replicationStates) {
      logger.info(`[SyncService] Cancelling replication for ${name}...`);
      cancelPromises.push(replicationState.cancel());
    }

    await Promise.all(cancelPromises);
    this.replicationStates.clear();
    this.isSyncing = false;

    // 如果不是因为错误停止，则设置为 Idle
    if (!keepErrorState) {
      runInAction(() => {
        this.status = SyncStatus.Idle;
      });
    }

    logger.info('[SyncService] Sync stopped');
  }

  /**
   * 手动触发同步
   * 触发所有 collection 的重新同步
   */
  public async triggerSync(): Promise<void> {
    // 重置错误计数器，允许用户手动重试
    this.consecutiveErrorCount = 0;

    if (!this.isSyncing) {
      logger.warn('[SyncService] Sync not running, starting first...');
      await this.startSync();
      return;
    }

    logger.info('[SyncService] Triggering manual sync...');

    runInAction(() => {
      this.status = SyncStatus.Syncing;
      this.lastError = null;
    });

    // reSync 是同步方法，触发重新同步
    // 状态更新由 active$ 和 error$ 订阅处理
    for (const [name, replicationState] of this.replicationStates) {
      logger.info(`[SyncService] Resyncing ${name}...`);
      replicationState.reSync();
    }

    logger.info('[SyncService] Manual sync triggered, waiting for completion...');
  }

  /**
   * 处理同步错误
   * 递增错误计数器，超过阈值则停止同步
   */
  private async handleSyncError(errorMessage: string): Promise<void> {
    this.consecutiveErrorCount++;
    logger.warn(
      `[SyncService] Consecutive error count: ${this.consecutiveErrorCount}/${SyncService.MAX_CONSECUTIVE_ERRORS}`
    );

    runInAction(() => {
      this.status = SyncStatus.Error;
      this.lastError = errorMessage;
    });

    if (this.consecutiveErrorCount >= SyncService.MAX_CONSECUTIVE_ERRORS) {
      logger.error('[SyncService] Max consecutive errors reached, stopping sync...');
      await this.stopSync(true); // 保持错误状态
      // TODO: i18n
      alert.info(
        '同步失败次数过多，已自动停止同步。请检查网络连接后点击"立即同步"重试，如果仍然有问题，请加入社群反馈。'
      );
    }
  }

  /**
   * 重置错误计数器（成功同步时调用）
   */
  private resetErrorCount(): void {
    if (this.consecutiveErrorCount > 0) {
      logger.info('[SyncService] Resetting error count after successful sync');
      this.consecutiveErrorCount = 0;
    }
  }

  /**
   * 为单个 collection 创建 replication
   */
  private createReplication(
    collection: RxCollection<unknown>,
    backendCollectionName: SyncCollectionName,
    collectionName: SyncCollectionKey
  ): RxReplicationState<SyncDocument, SyncCheckpoint> {
    logger.info(`[SyncService] Creating replication for ${collectionName} -> ${backendCollectionName}`);

    const replicationState = replicateRxCollection<SyncDocument, SyncCheckpoint>({
      collection: collection as RxCollection<SyncDocument>,
      replicationIdentifier: `sync-${backendCollectionName}`,
      live: true, // 实时同步
      retryTime: 5000, // 重试间隔 5 秒
      waitForLeadership: true, // 等待成为 leader 才同步（多标签页场景）
      autoStart: true,

      // 拉取处理器
      pull: {
        async handler(checkpointOrNull, batchSize) {
          try {
            logger.debug(`[SyncService] Pulling ${backendCollectionName}...`, { checkpoint: checkpointOrNull });

            const response = await serverService.syncPull(
              backendCollectionName,
              checkpointOrNull as SyncCheckpoint | null,
              batchSize
            );

            // 转换文档格式
            const documents = response.documents.map(fromBackendDoc);

            logger.debug(`[SyncService] Pulled ${documents.length} documents from ${backendCollectionName}`);

            return {
              documents,
              checkpoint: response.checkpoint ?? undefined,
            };
          } catch (error) {
            logger.error(`[SyncService] Pull failed for ${backendCollectionName}:`, error);
            throw error;
          }
        },
        batchSize: 50,
      },

      // 推送处理器
      push: {
        async handler(docs) {
          try {
            logger.debug(`[SyncService] Pushing ${docs.length} documents to ${backendCollectionName}...`);

            // 转换文档格式
            const pushDocs = docs.map((doc) => ({
              assumed_master_state: doc.assumedMasterState
                ? toBackendDoc(doc.assumedMasterState as Record<string, unknown>)
                : null,
              new_fork_state: toBackendDoc(doc.newDocumentState as Record<string, unknown>),
            }));

            const response = await serverService.syncPush(backendCollectionName, pushDocs);

            // 返回冲突的文档（转换回 RxDB 格式）
            const conflicts = response.conflicts.map(fromBackendDoc);

            if (conflicts.length > 0) {
              logger.warn(`[SyncService] ${conflicts.length} conflicts detected for ${backendCollectionName}`);
            }

            logger.debug(`[SyncService] Push completed for ${backendCollectionName}`);

            return conflicts;
          } catch (error) {
            logger.error(`[SyncService] Push failed for ${backendCollectionName}:`, error);
            throw error;
          }
        },
        batchSize: 10,
      },
    });

    // 监听错误
    replicationState.error$.subscribe((error) => {
      logger.error(`[SyncService] Replication error for ${collectionName}:`, error);
      this.handleSyncError(error.message || 'Replication error');
    });

    // 监听活跃状态
    replicationState.active$.subscribe((active) => {
      if (active) {
        runInAction(() => {
          this.status = SyncStatus.Syncing;
        });
      } else {
        // 只有在没有错误的情况下才设置为 Idle
        // 如果当前是 Error 状态，保持错误状态
        if (this.status !== SyncStatus.Error) {
          this.resetErrorCount();
          runInAction(() => {
            this.status = SyncStatus.Idle;
            this.lastSyncTime = Date.now();
          });
        }
      }
    });

    return replicationState;
  }
}
