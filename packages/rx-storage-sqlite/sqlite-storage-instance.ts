import type {
    BulkWriteRow,
    EventBulk,
    PreparedQuery,
    RxConflictResultionTask,
    RxDocumentData,
    RxJsonSchema,
    RxStorageChangeEvent,
    RxStorageCountResult,
    RxStorageDefaultCheckpoint,
    RxStorageInstance,
    RxStorageInstanceCreationParams,
    RxStorageQueryResult,
    StringKeys,
    RxAttachmentWriteData,
} from 'rxdb';
import {
    categorizeBulkWriteRows,
    ensureNotFalsy,
    getPrimaryFieldOfPrimaryKey,
    RXDB_VERSION,
    now,
    randomCouchString,
    getDefaultRxDocumentMeta,
    flatClone,
} from 'rxdb';
import {
    Subject,
    Observable,
} from 'rxjs';
import type {
    SQLiteBasics,
    SQLiteInternals,
    SQLiteSettings,
    MangoQuerySQL,
} from './types';
import {
    RX_STORAGE_NAME_SQLITE,
    SQLITE_VARIABLES_LIMIT,
    PARAM_KEY,
    getCreateTableSQL,
    getCreateAttachmentsTableSQL,
    getCreateIndexSQL,
    getJsonExtract,
    docDataToSQLiteRow,
    sqliteRowToDocData,
    getDatabaseConnection,
    closeDatabaseConnection,
    sqliteTransaction,
    chunkArray,
    buildInClause,
} from './sqlite-helpers';
import { prepareSQLiteQuery } from './sqlite-query';


export class RxStorageInstanceSQLite<RxDocType> implements RxStorageInstance<
    RxDocType,
    SQLiteInternals,
    SQLiteSettings,
    RxStorageDefaultCheckpoint
> {
    public readonly primaryPath: StringKeys<RxDocumentData<RxDocType>>;
    public readonly tableName: string;
    public closed: boolean = false;

    private changes$: Subject<EventBulk<RxStorageChangeEvent<RxDocType>, RxStorageDefaultCheckpoint>>;
    private conflicts$: Subject<RxConflictResultionTask<RxDocType>>;

    constructor(
        public readonly storage: { name: string; rxdbVersion: string },
        public readonly databaseName: string,
        public readonly internals: SQLiteInternals,
        public readonly collectionName: string,
        public readonly schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>,
        public readonly options: Readonly<any>,
        public readonly settings: SQLiteSettings,
        public readonly devMode: boolean,
    ) {
        this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey) as any;
        this.tableName = `${collectionName}-${schema.version}`;
        this.changes$ = new Subject();
        this.conflicts$ = new Subject();
    }

    private async getDb() {
        return this.internals.databasePromise;
    }

    /**
     * BULK WRITE
     */
    async bulkWrite(
        documentWrites: BulkWriteRow<RxDocType>[],
        context: string,
    ): Promise<{
        success: RxDocumentData<RxDocType>[];
        error: any[];
    }> {
        if (this.closed) {
            throw new Error('RxStorageInstanceSQLite.bulkWrite(): storage instance is closed');
        }

        const db = await this.getDb();
        const primaryPath = this.primaryPath as string;
        const basics = this.settings.sqliteBasics;
        const tableName = this.tableName;

        // Fetch current documents
        const docIds = documentWrites.map((row) => (row.document as any)[primaryPath]);

        const currentDocsMap = new Map<string, RxDocumentData<RxDocType>>();
        const chunks = chunkArray(docIds, SQLITE_VARIABLES_LIMIT);
        for (const chunk of chunks) {
            const inClause = buildInClause(chunk.length);
            const rows = await basics.all(db, {
                query: `SELECT data FROM "${tableName}" WHERE id IN ${inClause}`,
                params: chunk,
            });
            for (const row of rows) {
                const doc = sqliteRowToDocData(row);
                currentDocsMap.set(doc[primaryPath], doc);
            }
        }

        // Categorize writes
        const categorized = categorizeBulkWriteRows(
            this as any,
            primaryPath,
            currentDocsMap,
            documentWrites,
            context,
        );

        // Apply writes in a transaction
        if (categorized.bulkInsertDocs.length > 0 || categorized.bulkUpdateDocs.length > 0) {
            await sqliteTransaction(db, basics, async () => {
                // Inserts
                for (const doc of categorized.bulkInsertDocs) {
                    const row = docDataToSQLiteRow(primaryPath, doc);
                    await basics.run(db, {
                        query: `INSERT INTO "${tableName}" (id, revision, deleted, lastWriteTime, data) VALUES (${PARAM_KEY}, ${PARAM_KEY}, ${PARAM_KEY}, ${PARAM_KEY}, ${PARAM_KEY})`,
                        params: [row.id, row.revision, row.deleted, row.lastWriteTime, row.data],
                    });
                }

                // Updates
                for (const doc of categorized.bulkUpdateDocs) {
                    const row = docDataToSQLiteRow(primaryPath, doc);
                    await basics.run(db, {
                        query: `UPDATE "${tableName}" SET revision = ${PARAM_KEY}, deleted = ${PARAM_KEY}, lastWriteTime = ${PARAM_KEY}, data = ${PARAM_KEY} WHERE id = ${PARAM_KEY}`,
                        params: [row.revision, row.deleted, row.lastWriteTime, row.data, row.id],
                    });
                }
            });
        }

        // Emit events
        if (categorized.eventBulk.events.length > 0) {
            const lastEvent = categorized.eventBulk.events[categorized.eventBulk.events.length - 1];
            categorized.eventBulk.checkpoint = {
                id: (lastEvent.documentData as any)[primaryPath],
                lwt: lastEvent.documentData._meta.lwt,
            };
            categorized.eventBulk.endTime = now();
            this.changes$.next(categorized.eventBulk);
        }

        return {
            success: [
                ...categorized.bulkInsertDocs,
                ...categorized.bulkUpdateDocs,
            ],
            error: categorized.errors,
        };
    }

    /**
     * FIND DOCUMENTS BY IDS
     */
    async findDocumentsById(
        ids: string[],
        withDeleted: boolean,
    ): Promise<RxDocumentData<RxDocType>[]> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;
        const result: RxDocumentData<RxDocType>[] = [];
        const chunks = chunkArray(ids, SQLITE_VARIABLES_LIMIT);

        for (const chunk of chunks) {
            const inClause = buildInClause(chunk.length);
            const deletedCondition = withDeleted ? '' : ' AND deleted = 0';
            const rows = await basics.all(db, {
                query: `SELECT data FROM "${this.tableName}" WHERE id IN ${inClause}${deletedCondition}`,
                params: chunk,
            });
            for (const row of rows) {
                result.push(sqliteRowToDocData(row));
            }
        }

        return result;
    }

    /**
     * QUERY
     */
    async query(
        preparedQuery: PreparedQuery<RxDocType>,
    ): Promise<RxStorageQueryResult<RxDocType>> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;

        const sqlQuery = prepareSQLiteQuery(
            this.schema,
            preparedQuery.query,
            this.tableName,
        );

        const rows = await basics.all(db, {
            query: sqlQuery.sqlQuery,
            params: sqlQuery.sqlParams,
        });

        const documents = rows.map((row: any) => sqliteRowToDocData(row));

        return { documents };
    }

    /**
     * COUNT
     */
    async count(
        preparedQuery: PreparedQuery<RxDocType>,
    ): Promise<RxStorageCountResult> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;

        const sqlQuery = prepareSQLiteQuery(
            this.schema,
            preparedQuery.query,
            this.tableName,
        );

        const rows = await basics.all(db, {
            query: sqlQuery.countQuery,
            params: sqlQuery.countParams,
        });

        return {
            count: rows[0]?.count ?? 0,
            mode: 'fast',
        };
    }

    /**
     * GET ATTACHMENT DATA
     */
    async getAttachmentData(
        documentId: string,
        attachmentId: string,
        _digest: string,
    ): Promise<string> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;
        const key = `${documentId}|${attachmentId}`;

        const rows = await basics.all(db, {
            query: `SELECT data FROM "${this.tableName}_attachments" WHERE docIdWithAttachmentId = ${PARAM_KEY}`,
            params: [key],
        });

        if (!rows.length) {
            throw new Error(`attachment not found: ${key}`);
        }

        const data = rows[0].data;
        if (typeof data === 'string') {
            return data;
        }
        // Convert buffer to base64
        if (Buffer && data instanceof Buffer) {
            return data.toString('base64');
        }
        return String(data);
    }

    /**
     * GET CHANGED DOCUMENTS SINCE
     */
    async getChangedDocumentsSince(
        limit: number,
        checkpoint?: RxStorageDefaultCheckpoint,
    ): Promise<{
        documents: RxDocumentData<RxDocType>[];
        checkpoint: RxStorageDefaultCheckpoint;
    }> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;
        const params: any[] = [];
        let whereClause: string;

        if (checkpoint) {
            whereClause = `WHERE (lastWriteTime > ${PARAM_KEY}) OR (lastWriteTime = ${PARAM_KEY} AND id > ${PARAM_KEY})`;
            params.push(checkpoint.lwt, checkpoint.lwt, checkpoint.id);
        } else {
            whereClause = '';
        }

        const rows = await basics.all(db, {
            query: `SELECT data FROM "${this.tableName}" ${whereClause} ORDER BY lastWriteTime ASC, id ASC LIMIT ${limit}`,
            params,
        });

        const documents = rows.map((row: any) => sqliteRowToDocData(row));
        const lastDoc = documents.length > 0 ? documents[documents.length - 1] : undefined;

        return {
            documents,
            checkpoint: lastDoc
                ? {
                    id: (lastDoc as any)[this.primaryPath],
                    lwt: lastDoc._meta.lwt,
                }
                : checkpoint || { id: '', lwt: 0 },
        };
    }

    /**
     * CHANGE STREAM
     */
    changeStream(): Observable<EventBulk<RxStorageChangeEvent<RxDocType>, RxStorageDefaultCheckpoint>> {
        return this.changes$.asObservable();
    }

    /**
     * CLEANUP
     */
    async cleanup(minimumDeletedTime: number): Promise<boolean> {
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;
        const maxDeletionTime = now() - minimumDeletedTime;

        await basics.run(db, {
            query: `DELETE FROM "${this.tableName}" WHERE deleted = 1 AND lastWriteTime < ${PARAM_KEY}`,
            params: [maxDeletionTime],
        });

        // Check if there are still deleted docs
        const remaining = await basics.all(db, {
            query: `SELECT COUNT(*) as count FROM "${this.tableName}" WHERE deleted = 1`,
            params: [],
        });

        return remaining[0]?.count === 0;
    }

    /**
     * CONFLICT RESULT STREAM
     */
    conflictResultionTasks(): Observable<RxConflictResultionTask<RxDocType>> {
        return this.conflicts$.asObservable();
    }

    async resolveConflictResultionTask(
        _taskSolution: any,
    ): Promise<void> {
        // no-op for SQLite
    }

    /**
     * CLOSE
     */
    async close(): Promise<void> {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.changes$.complete();
        this.conflicts$.complete();

        await closeDatabaseConnection(
            this.settings.sqliteBasics,
            this.databaseName,
        );
    }

    /**
     * REMOVE (delete all data)
     */
    async remove(): Promise<void> {
        if (this.closed) {
            throw new Error('already closed');
        }
        const db = await this.getDb();
        const basics = this.settings.sqliteBasics;

        await basics.run(db, { query: `DROP TABLE IF EXISTS "${this.tableName}"`, params: [] });
        await basics.run(db, { query: `DROP TABLE IF EXISTS "${this.tableName}_attachments"`, params: [] });

        await this.close();
    }
}

/**
 * Create a new SQLite storage instance.
 * Sets up the database connection, creates tables and indexes.
 */
export async function createSQLiteStorageInstance<RxDocType>(
    storage: { name: string; rxdbVersion: string },
    params: RxStorageInstanceCreationParams<RxDocType, SQLiteSettings>,
    settings: SQLiteSettings,
): Promise<RxStorageInstanceSQLite<RxDocType>> {
    const basics = settings.sqliteBasics;
    const dbName = params.databaseName;
    const db = await getDatabaseConnection(basics, dbName);

    const primaryPath = getPrimaryFieldOfPrimaryKey(params.schema.primaryKey) as string;
    const tableName = `${params.collectionName}-${params.schema.version}`;

    // Create main table
    await basics.run(db, getCreateTableSQL(tableName, settings.withoutRowid));

    // Create attachments table if schema has attachments
    if (params.schema.attachments) {
        await basics.run(db, getCreateAttachmentsTableSQL(tableName, settings.withoutRowid));
    }

    // Create indexes
    const indexes = params.schema.indexes || [];
    for (let i = 0; i < indexes.length; i++) {
        const indexDef = indexes[i];
        const indexFields = Array.isArray(indexDef) ? indexDef : [indexDef];
        const columns = indexFields.map((field) => getJsonExtract(primaryPath, field as string));
        const indexName = `idx_${tableName}_${i}`;
        await basics.run(db, getCreateIndexSQL(tableName, indexName, columns));
    }

    // Create default indexes on deleted and lastWriteTime
    await basics.run(db, getCreateIndexSQL(tableName, `idx_${tableName}_deleted`, ['deleted']));
    await basics.run(db, getCreateIndexSQL(tableName, `idx_${tableName}_lwt`, ['lastWriteTime']));

    const internals: SQLiteInternals = {
        databasePromise: Promise.resolve(db),
    };

    const instance = new RxStorageInstanceSQLite(
        storage,
        dbName,
        internals,
        params.collectionName,
        params.schema,
        params.options || {},
        settings,
        params.devMode || false,
    );

    return instance;
}
