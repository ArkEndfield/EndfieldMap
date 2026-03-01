/**
 * RxDB Audit Log Plugin
 *
 * Automatically tracks insert, update, and delete operations
 * on RxDB collections and logs them via the provided logger.
 *
 * Game data collections are excluded by default since they are read-only.
 * Only user data collections (presets, nodes, marks, visibility) are audited.
 */

import diff, { type Difference } from 'microdiff';
import type { RxCollection, RxPlugin } from 'rxdb/plugins/core';
import type { Subscription } from 'rxjs';

const LOG_TAG = '[AuditLog]';

const DEFAULT_EXCLUDE_FIELDS: ReadonlySet<string> = new Set([
  '_rev',
  '_deleted',
  '_attachments',
  '_meta',
]);

const DEFAULT_EXCLUDE_COLLECTIONS: ReadonlySet<string> = new Set([
  'gameItem',
  'gameChestReward',
  'gameDungeonSeries',
  'gameDeltaRobotParsedLevel',
]);

const subscriptionMap = new Map<string, Subscription[]>();

interface AuditLogger {
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

export interface AuditLogPluginOptions {
  logger: AuditLogger;
  excludeCollections?: string[];
  excludeFields?: string[];
}

function filterInternalFields(
  data: Record<string, unknown>,
  excludeFields: ReadonlySet<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (!excludeFields.has(key) && !key.startsWith('_')) {
      result[key] = data[key];
    }
  }
  return result;
}

function formatDiff(changes: Difference[]): string {
  return changes
    .map((c) => {
      const path = c.path.join('.');
      switch (c.type) {
        case 'CREATE':
          return `  + ${path}: ${JSON.stringify(c.value)}`;
        case 'REMOVE':
          return `  - ${path}: ${JSON.stringify(c.oldValue)}`;
        case 'CHANGE':
          return `  ~ ${path}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.value)}`;
      }
    })
    .join('\n');
}

function setupCollectionAudit(collection: RxCollection, options: AuditLogPluginOptions): void {
  const key = `${collection.database.name}-${collection.name}`;
  const log = options.logger;

  const existing = subscriptionMap.get(key);
  if (existing) {
    existing.forEach((sub) => sub.unsubscribe());
  }

  const excludeFields: ReadonlySet<string> = new Set([
    ...DEFAULT_EXCLUDE_FIELDS,
    ...(options.excludeFields ?? []),
  ]);

  const subs: Subscription[] = [];
  const primaryPath = collection.schema.primaryPath;

  subs.push(
    collection.insert$.subscribe((event) => {
      const data = event.documentData as Record<string, unknown>;
      const id = String(data[primaryPath] ?? 'unknown');
      log.debug(`${LOG_TAG} INSERT ${collection.name}#${id}`, filterInternalFields(data, excludeFields));
    }),
  );

  subs.push(
    collection.update$.subscribe((event) => {
      const data = event.documentData as Record<string, unknown>;
      const prev = event.previousDocumentData as Record<string, unknown> | undefined;
      const id = String(data[primaryPath] ?? 'unknown');

      if (!prev) {
        log.debug(`${LOG_TAG} UPDATE ${collection.name}#${id} (no previous data)`);
        return;
      }

      const filteredPrev = filterInternalFields(prev, excludeFields);
      const filteredCurr = filterInternalFields(data, excludeFields);
      const changes = diff(filteredPrev, filteredCurr);

      if (changes.length > 0) {
        log.debug(`${LOG_TAG} UPDATE ${collection.name}#${id}\n${formatDiff(changes)}`);
      }
    }),
  );

  subs.push(
    collection.remove$.subscribe((event) => {
      const data = event.documentData as Record<string, unknown>;
      const id = String(data[primaryPath] ?? 'unknown');
      log.debug(`${LOG_TAG} DELETE ${collection.name}#${id}`);
    }),
  );

  subscriptionMap.set(key, subs);
  log.info(`${LOG_TAG} Enabled for collection: ${collection.name}`);
}

/**
 * Factory function to create the audit log plugin.
 *
 * @example
 * ```ts
 * import { logger } from '@endfieldmap/tools';
 * addRxPlugin(createAuditLogPlugin({ logger }));
 * ```
 */
export function createAuditLogPlugin(options: AuditLogPluginOptions): RxPlugin {
  const excludeCollections = new Set([
    ...DEFAULT_EXCLUDE_COLLECTIONS,
    ...(options.excludeCollections ?? []),
  ]);

  return {
    name: 'audit-log',
    rxdb: true,
    prototypes: {},
    overwritable: {},
    hooks: {
      createRxCollection: {
        after({ collection }: { collection: RxCollection }) {
          if (excludeCollections.has(collection.name)) {
            return;
          }
          setupCollectionAudit(collection, options);
        },
      },
    },
  };
}

export function cleanupAuditLog(): void {
  for (const [, subs] of subscriptionMap) {
    subs.forEach((sub) => sub.unsubscribe());
  }
  subscriptionMap.clear();
}
