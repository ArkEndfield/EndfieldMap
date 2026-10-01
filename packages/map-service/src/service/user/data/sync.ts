import {
  RXDB_TO_BACKEND_COLLECTION,
  type SyncCheckpoint,
  type SyncCollectionName,
  type SyncDocumentState,
  SyncStatus,
} from '@endfieldmap/map-service/@types';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import type { ServerService } from '@endfieldmap/map-service/service/server';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { logger } from '@endfieldmap/tools';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import type { RxCollection, WithDeleted } from 'rxdb';
import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';

type SyncDocument = WithDeleted<Record<string, unknown>>;

const SYNC_COLLECTION_NAMES = [
  'customPointNode',
  'customPointPreset',
  'electricPoleNode',
  'electricPolePreset',
  'entityMark',
] as const;

type SyncCollectionKey = (typeof SYNC_COLLECTION_NAMES)[number];

function toBackendDoc(doc: Record<string, unknown>): SyncDocumentState {
  const { id, updatedAt, syncScope, _deleted, _meta, _rev, _attachments, ...fields } = doc;
  const deleted = _deleted === true;

  return {
    id: id as string,
    ...(typeof syncScope === 'string' ? { scope: syncScope } : {}),
    updated_at: (updatedAt as number) || Date.now(),
    deleted,
    fields: fields as Record<string, unknown>,
  };
}

function fromBackendDoc(backendDoc: SyncDocumentState): SyncDocument {
  const { _deleted, _meta, _rev, _attachments, ...cleanFields } = backendDoc.fields as Record<string, unknown>;
  return {
    ...cleanFields,
    id: backendDoc.id,
    updatedAt: backendDoc.updated_at,
    _deleted: backendDoc.deleted,
    ...(backendDoc.scope ? { syncScope: backendDoc.scope } : {}),
  };
}

export interface SyncServiceConfig<T, R> {
  serverService: ServerService;
  i18nService: I18nService;
  databaseService: DatabaseService<T, R>;
}

export class SyncService<T, R> {
  @observable.ref
  accessor status: SyncStatus = SyncStatus.Idle;

  @observable.ref
  accessor lastError: string | null = null;

  @observable.ref
  accessor lastSyncTime: number | null = null;

  private replicationStates: Map<SyncCollectionKey, RxReplicationState<SyncDocument, SyncCheckpoint>> = new Map();
  private isSyncing: boolean = false;
  private lifecycleQueue: Promise<void> = Promise.resolve();
  private consecutiveErrorCount: number = 0;
  private static readonly MAX_CONSECUTIVE_ERRORS = 5;
  private databaseService: DatabaseService<T, R>;
  private serverService: ServerService;
  private i18nService: I18nService;

  constructor(config: SyncServiceConfig<T, R>) {
    this.databaseService = config.databaseService;
    this.serverService = config.serverService;
    this.i18nService = config.i18nService;
    makeObservable(this);
  }

  @computed
  get isSyncingStatus(): boolean {
    return this.status === SyncStatus.Syncing;
  }

  @computed
  get isError(): boolean {
    return this.status === SyncStatus.Error;
  }

  private enqueueLifecycle(work: () => Promise<void>): Promise<void> {
    const next = this.lifecycleQueue.then(work);
    this.lifecycleQueue = next.catch(() => undefined);
    return next;
  }

  public startSync(): Promise<void> {
    return this.enqueueLifecycle(() => this._startSync());
  }

  /**
   * 未在同步时启动；已在同步则保持原状态。
   * 与 startSync 的区别：startSync 会先停掉旧 replication 再重建，
   * 适用于换库后的强制重启；这里用于 uid 列表刷新等重复触发的场景，
   * 避免 replication 反复 cancel/重建打断正常推送。
   */
  public ensureSyncing(): Promise<void> {
    return this.enqueueLifecycle(async () => {
      if (this.isSyncing) return;
      await this._startSync();
    });
  }

  private async _startSync(): Promise<void> {
    if (this.isSyncing) {
      logger.warn('[SyncService] Sync already running, stopping first...');
      await this._stopSync();
    }

    if (!this.databaseService.user_db || !this.serverService.getUid()) {
      logger.debug('[SyncService] User database not initialized yet, skipping sync start');
      return;
    }

    logger.info('[SyncService] Starting sync...');
    this.isSyncing = true;
    this.consecutiveErrorCount = 0;

    runInAction(() => {
      this.status = SyncStatus.Syncing;
      this.lastError = null;
    });

    try {
      const db = this.databaseService.database;

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
      await this._stopSync(true);
      runInAction(() => {
        this.status = SyncStatus.Error;
        this.lastError = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }

  public stopSync(keepErrorState: boolean = false): Promise<void> {
    return this.enqueueLifecycle(() => this._stopSync(keepErrorState));
  }

  /**
   * 停止同步并物理清除 replication 元数据（checkpoint + assumed-master-state）。
   * 「清除标点数据」等本地重置用：只停同步会把墓碑与元数据留在库里，
   * 下次 startSync 把删除推上云 / 或让清空后的本地拉不回云端存量。
   * 元数据由各 replicationState.remove() 抹掉（同时会 cancel 自身）。
   */
  public async stopSyncAndPurgeMeta(): Promise<void> {
    await this.enqueueLifecycle(async () => {
      const removes: Promise<void>[] = [];
      for (const [name, state] of this.replicationStates) {
        logger.info(`[SyncService] Removing replication meta for ${name}...`);
        removes.push(state.remove());
      }
      await Promise.all(removes);
      this.replicationStates.clear();
      this.isSyncing = false;
      runInAction(() => {
        this.status = SyncStatus.Idle;
      });
      logger.info('[SyncService] Stopped and replication meta purged');
    });
  }

  private async _stopSync(keepErrorState: boolean = false): Promise<void> {
    logger.info('[SyncService] Stopping sync...');

    const cancelPromises: Promise<void>[] = [];
    for (const [name, replicationState] of this.replicationStates) {
      logger.info(`[SyncService] Cancelling replication for ${name}...`);
      cancelPromises.push(replicationState.cancel());
    }

    await Promise.all(cancelPromises);
    this.replicationStates.clear();
    this.isSyncing = false;

    if (!keepErrorState) {
      runInAction(() => {
        this.status = SyncStatus.Idle;
      });
    }

    logger.info('[SyncService] Sync stopped');
  }

  /**
   * Wait for all replication states to complete their initial pull.
   * Useful for in-memory storage where data is lost on restart.
   */
  public async awaitInitialReplication(): Promise<void> {
    if (this.replicationStates.size === 0) return;

    const promises: Promise<void>[] = [];
    for (const [name, state] of this.replicationStates) {
      promises.push(
        state.awaitInitialReplication().catch((err) => {
          logger.warn(`[SyncService] Initial replication failed for ${name}:`, err);
        })
      );
    }
    await Promise.all(promises);
    logger.info('[SyncService] All initial replications completed');
  }

  public triggerSync(): Promise<void> {
    return this.enqueueLifecycle(() => this._triggerSync());
  }

  private async _triggerSync(): Promise<void> {
    this.consecutiveErrorCount = 0;

    if (!this.isSyncing) {
      logger.warn('[SyncService] Sync not running, starting first...');
      await this._startSync();
      return;
    }

    logger.info('[SyncService] Triggering manual sync...');

    runInAction(() => {
      this.status = SyncStatus.Syncing;
      this.lastError = null;
    });

    for (const [name, replicationState] of this.replicationStates) {
      logger.info(`[SyncService] Resyncing ${name}...`);
      replicationState.reSync();
    }

    logger.info('[SyncService] Manual sync triggered, waiting for completion...');
  }

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
      await this.stopSync(true);
      serviceEmitter.fire(
        SERVICE_EVENT.ALERT_INFO,
        this.i18nService.translate('sync_failed_too_much', {
          ns: 'error',
          defaultValue:
            '同步失败次数过多，已自动停止同步。请检查网络连接后点击"立即同步"重试，如果仍然有问题，请加入社群反馈。',
        })
      );
    }
  }

  private resetErrorCount(): void {
    if (this.consecutiveErrorCount > 0) {
      logger.info('[SyncService] Resetting error count after successful sync');
      this.consecutiveErrorCount = 0;
    }
  }

  private createReplication(
    collection: RxCollection<unknown>,
    backendCollectionName: SyncCollectionName,
    collectionName: SyncCollectionKey
  ): RxReplicationState<SyncDocument, SyncCheckpoint> {
    logger.info(`[SyncService] Creating replication for ${collectionName} -> ${backendCollectionName}`);

    const serverService = this.serverService;
    const roleId = serverService.getUid();
    if (!roleId) throw new Error('Sync role is not selected');

    const replicationState = replicateRxCollection<SyncDocument, SyncCheckpoint>({
      collection: collection as RxCollection<SyncDocument>,
      replicationIdentifier: `sync-v2-${collection.database.name}-${roleId}-${backendCollectionName}`,
      live: true,
      retryTime: 5000,
      waitForLeadership: true,
      autoStart: true,

      pull: {
        async handler(checkpointOrNull, batchSize) {
          try {
            logger.debug(`[SyncService] Pulling ${backendCollectionName}...`, { checkpoint: checkpointOrNull });

            const response = await serverService.syncPull(
              backendCollectionName,
              checkpointOrNull as SyncCheckpoint | null,
              batchSize,
              roleId
            );

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

      push: {
        async handler(docs) {
          try {
            logger.debug(`[SyncService] Pushing ${docs.length} documents to ${backendCollectionName}...`);

            const pushDocs = docs.map((doc) => ({
              assumed_master_state: doc.assumedMasterState
                ? toBackendDoc(doc.assumedMasterState as Record<string, unknown>)
                : null,
              new_fork_state: toBackendDoc(doc.newDocumentState as Record<string, unknown>),
            }));

            const response = await serverService.syncPush(backendCollectionName, pushDocs, roleId);

            const conflicts = response.conflicts.map(fromBackendDoc);

            if (conflicts.length > 0) {
              logger.warn(
                `[SyncService] ${conflicts.length} conflicts for ${backendCollectionName}`,
                conflicts.map((c) => ({ id: c.id, _deleted: c._deleted }))
              );
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

    replicationState.error$.subscribe((error) => {
      logger.error(`[SyncService] Replication error for ${collectionName}:`, error);
      this.handleSyncError(error.message || 'Replication error');
    });

    replicationState.active$.subscribe((active) => {
      if (active) {
        runInAction(() => {
          this.status = SyncStatus.Syncing;
        });
      } else {
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
