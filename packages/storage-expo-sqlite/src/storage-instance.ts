import type {
  BulkWriteRow,
  EventBulk,
  PreparedQuery,
  RxDocumentData,
  RxJsonSchema,
  RxStorageBulkWriteResponse,
  RxStorageChangeEvent,
  RxStorageCountResult,
  RxStorageInstance,
  RxStorageInstanceCreationParams,
  RxStorageQueryResult,
  StringKeys,
} from 'rxdb';
import {
  categorizeBulkWriteRows,
  getPrimaryFieldOfPrimaryKey,
  getQueryMatcher,
  now,
} from 'rxdb';
import { Observable, Subject } from 'rxjs';

import { buildQuery } from './query-builder';
import { id, sql } from './sql-builder';
import {
  createTables,
  dropTables,
  getAttachment,
  getAttachmentTableName,
  getDocumentsByIds,
  getTableName,
  insertDocument,
  removeAllAttachments,
  removeAttachment,
  setAttachment,
  updateDocument,
} from './sqlite-helpers';
import type {
  ExpoSQLiteCheckpoint,
  ExpoSQLiteInstanceCreationOptions,
  ExpoSQLiteInternals,
  ExpoSQLiteStorageOptions,
} from './types';

export class ExpoSQLiteStorageInstance<RxDocType>
  implements
    RxStorageInstance<
      RxDocType,
      ExpoSQLiteInternals,
      ExpoSQLiteInstanceCreationOptions,
      ExpoSQLiteCheckpoint
    >
{
  readonly databaseName: string;
  readonly collectionName: string;
  readonly schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>;
  readonly internals: Readonly<ExpoSQLiteInternals>;
  readonly options: Readonly<ExpoSQLiteInstanceCreationOptions>;

  private changes$ = new Subject<
    EventBulk<
      RxStorageChangeEvent<RxDocumentData<RxDocType>>,
      ExpoSQLiteCheckpoint
    >
  >();
  private primaryPath: string;

  constructor(
    params: RxStorageInstanceCreationParams<
      RxDocType,
      ExpoSQLiteInstanceCreationOptions
    >,
    internals: ExpoSQLiteInternals,
  ) {
    this.databaseName = params.databaseName;
    this.collectionName = params.collectionName;
    this.schema = params.schema;
    this.internals = internals;
    this.options = params.options;
    this.primaryPath = getPrimaryFieldOfPrimaryKey(
      this.schema.primaryKey,
    ) as string;
  }

  async bulkWrite(
    documentWrites: BulkWriteRow<RxDocType>[],
    context: string,
  ): Promise<RxStorageBulkWriteResponse<RxDocType>> {
    const { db, tableName } = this.internals;
    const primaryPath = this.primaryPath;

    // 1. Get all document IDs from the writes
    const ids = documentWrites.map((row) =>
      String(
        (row.document as Record<string, unknown>)[primaryPath],
      ),
    );

    // 2. Fetch current state from SQLite
    const docsInDb = getDocumentsByIds<RxDocType>(
      db,
      tableName,
      ids,
      primaryPath,
    );

    // 3. Use RxDB's categorization helper
    const categorized = categorizeBulkWriteRows<RxDocType>(
      this,
      this.primaryPath as StringKeys<RxDocType>,
      docsInDb,
      documentWrites,
      context,
    );

    // 4. Execute writes in a transaction
    if (
      categorized.bulkInsertDocs.length > 0 ||
      categorized.bulkUpdateDocs.length > 0 ||
      categorized.attachmentsAdd.length > 0 ||
      categorized.attachmentsUpdate.length > 0 ||
      categorized.attachmentsRemove.length > 0
    ) {
      db.withTransactionSync(() => {
        for (const row of categorized.bulkInsertDocs) {
          insertDocument(db, tableName, row.document, primaryPath);
        }
        for (const row of categorized.bulkUpdateDocs) {
          updateDocument(db, tableName, row.document, primaryPath);
        }

        // Handle attachments
        const attachmentTableName = this.internals.attachmentTableName;
        for (const att of categorized.attachmentsAdd) {
          setAttachment(
            db,
            attachmentTableName,
            att.documentId,
            att.attachmentId,
            att.attachmentData.data,
            att.digest,
            att.attachmentData.length,
            att.attachmentData.type,
          );
        }
        for (const att of categorized.attachmentsUpdate) {
          setAttachment(
            db,
            attachmentTableName,
            att.documentId,
            att.attachmentId,
            att.attachmentData.data,
            att.digest,
            att.attachmentData.length,
            att.attachmentData.type,
          );
        }
        for (const att of categorized.attachmentsRemove) {
          removeAttachment(
            db,
            attachmentTableName,
            att.documentId,
            att.attachmentId,
          );
        }
      });
    }

    // 5. Emit change events
    const eventBulk = categorized.eventBulk;
    if (eventBulk.events.length > 0) {
      const lastDoc =
        eventBulk.events[eventBulk.events.length - 1]!.documentData;
      eventBulk.checkpoint = {
        id: String(
          (lastDoc as Record<string, unknown>)[primaryPath],
        ),
        lwt: lastDoc._meta.lwt,
      };
      this.changes$.next(
        eventBulk as EventBulk<
          RxStorageChangeEvent<RxDocumentData<RxDocType>>,
          ExpoSQLiteCheckpoint
        >,
      );
    }

    return { error: categorized.errors };
  }

  async findDocumentsById(
    ids: string[],
    withDeleted: boolean,
  ): Promise<RxDocumentData<RxDocType>[]> {
    const { db, tableName } = this.internals;
    const primaryPath = this.primaryPath;

    const docsMap = getDocumentsByIds<RxDocType>(
      db,
      tableName,
      ids,
      primaryPath,
      withDeleted,
    );

    return Array.from(docsMap.values());
  }

  async query(
    preparedQuery: PreparedQuery<RxDocType>,
  ): Promise<RxStorageQueryResult<RxDocType>> {
    const { db, tableName } = this.internals;
    const { sql, params, needsJsFilter } = buildQuery(
      tableName,
      this.schema,
      preparedQuery.query,
      'select',
    );

    const rows = db.getAllSync<{ data: string }>(sql, params);
    let documents = rows.map(
      (row) => JSON.parse(row.data) as RxDocumentData<RxDocType>,
    );

    // If query contains $regex or other non-translatable operators,
    // apply JS-level filtering
    if (needsJsFilter) {
      const matcher = getQueryMatcher(this.schema, preparedQuery.query);
      documents = documents.filter((doc) => matcher(doc));
    }

    return { documents };
  }

  async count(
    preparedQuery: PreparedQuery<RxDocType>,
  ): Promise<RxStorageCountResult> {
    const { db, tableName } = this.internals;
    const { sql, params, needsJsFilter } = buildQuery(
      tableName,
      this.schema,
      preparedQuery.query,
      'count',
    );

    if (needsJsFilter) {
      // Fallback: query all matching docs and count in JS
      const queryResult = await this.query(preparedQuery);
      return { count: queryResult.documents.length, mode: 'slow' };
    }

    const row = db.getFirstSync<{ count: number }>(sql, params);
    return { count: row?.count ?? 0, mode: 'fast' };
  }

  async getAttachmentData(
    documentId: string,
    attachmentId: string,
    digest: string,
  ): Promise<string> {
    const { db, attachmentTableName } = this.internals;
    const data = getAttachment(
      db,
      attachmentTableName,
      documentId,
      attachmentId,
      digest,
    );
    if (data === null) {
      throw new Error(
        `Attachment not found: docId=${documentId}, attachmentId=${attachmentId}, digest=${digest}`,
      );
    }
    return data;
  }

  async getChangedDocumentsSince(
    limit: number,
    checkpoint?: ExpoSQLiteCheckpoint,
  ): Promise<{
    documents: RxDocumentData<RxDocType>[];
    checkpoint: ExpoSQLiteCheckpoint;
  }> {
    const { db, tableName } = this.internals;
    const tbl = id(tableName);

    const q = !checkpoint
      ? sql`SELECT data FROM ${tbl} ORDER BY lwt ASC, id ASC LIMIT ${limit}`
      : sql`SELECT data FROM ${tbl} WHERE (lwt > ${checkpoint.lwt}) OR (lwt = ${checkpoint.lwt} AND id > ${checkpoint.id}) ORDER BY lwt ASC, id ASC LIMIT ${limit}`;

    const rows = db.getAllSync<{ data: string }>(q.text, q.params);
    const documents = rows.map(
      (row) => JSON.parse(row.data) as RxDocumentData<RxDocType>,
    );

    const primaryPath = this.primaryPath;
    const newCheckpoint: ExpoSQLiteCheckpoint =
      documents.length > 0
        ? {
            id: String(
              (documents[documents.length - 1] as Record<string, unknown>)[
                primaryPath
              ],
            ),
            lwt: documents[documents.length - 1]!._meta.lwt,
          }
        : checkpoint ?? { id: '', lwt: 0 };

    return { documents, checkpoint: newCheckpoint };
  }

  changeStream(): Observable<
    EventBulk<
      RxStorageChangeEvent<RxDocumentData<RxDocType>>,
      ExpoSQLiteCheckpoint
    >
  > {
    return this.changes$.asObservable();
  }

  async cleanup(minimumDeletedTime: number): Promise<boolean> {
    const { db, tableName, attachmentTableName } = this.internals;
    const maxLwt = now() - minimumDeletedTime;
    const tbl = id(tableName);

    // Get IDs of documents to clean up (for attachment cleanup)
    const selectQ = sql`SELECT id FROM ${tbl} WHERE deleted = 1 AND lwt < ${maxLwt}`;
    const docsToClean = db.getAllSync<{ id: string }>(
      selectQ.text,
      selectQ.params,
    );

    if (docsToClean.length > 0) {
      db.withTransactionSync(() => {
        for (const doc of docsToClean) {
          removeAllAttachments(db, attachmentTableName, doc.id);
        }
        const deleteQ = sql`DELETE FROM ${tbl} WHERE deleted = 1 AND lwt < ${maxLwt}`;
        db.runSync(deleteQ.text, deleteQ.params);
      });
    }

    // Check if there are still deleted docs remaining
    const countQ = sql`SELECT COUNT(*) as count FROM ${tbl} WHERE deleted = 1`;
    const remaining = db.getFirstSync<{ count: number }>(
      countQ.text,
      countQ.params,
    );
    return (remaining?.count ?? 0) === 0;
  }

  async close(): Promise<void> {
    if (this.internals.closed) return;
    (this.internals as { closed: boolean }).closed = true;
    this.changes$.complete();
    // Do not close db — it's managed externally and may be shared
  }

  async remove(): Promise<void> {
    const { db, tableName, attachmentTableName } = this.internals;
    dropTables(db, tableName, attachmentTableName);
    this.changes$.complete();
  }
}

export function createExpoSQLiteStorageInstance<RxDocType>(
  params: RxStorageInstanceCreationParams<
    RxDocType,
    ExpoSQLiteInstanceCreationOptions
  >,
  options: ExpoSQLiteStorageOptions,
): ExpoSQLiteStorageInstance<RxDocType> {
  const db = options.database;

  const tableName = getTableName(
    params.databaseName,
    params.collectionName,
    params.schema.version,
  );
  const attachmentTableName = getAttachmentTableName(tableName);

  // Create tables if they don't exist
  createTables(db, tableName, attachmentTableName);

  const internals: ExpoSQLiteInternals = {
    db,
    tableName,
    attachmentTableName,
    closed: false,
  };

  return new ExpoSQLiteStorageInstance(params, internals);
}
