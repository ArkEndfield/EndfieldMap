import { addRxPlugin, createRxDatabase } from 'rxdb/plugins/core';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@endfieldmap/tools', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@endfieldmap/map-service/service/service_emitter', () => ({
  serviceEmitter: { fire: vi.fn() },
  SERVICE_EVENT: {},
}));

import type { PushDocumentRow, SyncCheckpoint, SyncCollectionName, SyncDocumentState } from '../../../@types/sync';
import { markDataSchema } from '../../db/schema/user_data/mark';
import { SyncService } from './sync';

describe('RxDB sync protocol', () => {
  it('persists scope, converges after canonicalization, and sends scoped deletions', async () => {
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(RxDBMigrationSchemaPlugin);
    const db = await createRxDatabase({
      name: 'sync_role_test',
      storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
      multiInstance: false,
    });
    await db.addCollections({
      entityMark: { schema: markDataSchema, migrationStrategies: { 1: (doc: unknown) => doc } },
    });
    let selectedRole = '0';
    const remote = new Map<string, SyncDocumentState>();
    const server = {
      getUid: () => selectedRole,
      syncPull: vi.fn(
        async (_collection: SyncCollectionName, checkpoint: SyncCheckpoint | null, _size: number, role: string) => {
          expect(role).toBe('0');
          return { documents: checkpoint ? [] : [...remote.values()], checkpoint: { id: '', updated_at: 0 } };
        }
      ),
      syncPush: vi.fn(async (_collection: SyncCollectionName, rows: PushDocumentRow[], role: string) => {
        expect(role).toBe('0');
        const conflicts: SyncDocumentState[] = [];
        for (const row of rows) {
          const doc = row.new_fork_state;
          if (doc.deleted) expect(row.assumed_master_state?.scope).toBe('user32-role0-entitymark');
          const canonical = { ...doc, scope: 'user32-role0-entitymark' };
          remote.set(doc.id, canonical);
          if (!doc.scope) conflicts.push(canonical);
        }
        return { conflicts };
      }),
    };
    const service = new SyncService({
      databaseService: { user_db: db, database: db } as never,
      serverService: server as never,
      i18nService: {} as never,
    });
    try {
      await db.entityMark.insert({ id: 'm|1', mapId: 'm', entityId: 1, marked: true, createdAt: 1, updatedAt: 2 });
      await service.startSync();
      await service.awaitInitialReplication();
      await vi.waitFor(async () =>
        expect((await db.entityMark.findOne('m|1').exec())?.syncScope).toBe('user32-role0-entitymark')
      );
      const beforeDelete = server.syncPush.mock.calls.length;
      // 已创建复制器的请求目标不能随着可变 selectedRole 改写。
      selectedRole = '1429794416';
      await (await db.entityMark.findOne('m|1').exec())?.remove();
      await vi.waitFor(() => expect(remote.get('m|1')?.deleted).toBe(true));
      expect(server.syncPush.mock.calls.length - beforeDelete).toBeLessThan(4);
      await Promise.all([service.startSync(), service.stopSync()]);
      expect(service.status).toBe('idle');
    } finally {
      await service.stopSync();
      await db.remove();
    }
  });
});
