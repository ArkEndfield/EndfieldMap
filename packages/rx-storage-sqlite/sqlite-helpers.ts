import type { SQLiteQuery, SQLiteBasics, SQLiteConnectionState } from './types';

/**
 * Constants
 */
export const RX_STORAGE_NAME_SQLITE = 'sqlite';
export const SQLITE_VARIABLES_LIMIT = 999;
export const SQLITE_IN_MEMORY_DB_NAME = ':memory:';
export const NON_IMPLEMENTED_OPERATOR_QUERY_BATCH_SIZE = 50;
export const PARAM_KEY = '?';

/**
 * Table column definitions
 */
export const MAIN_TABLE_COLUMNS = [
    'id TEXT PRIMARY KEY NOT NULL',
    'revision TEXT NOT NULL',
    'deleted BOOLEAN NOT NULL',
    'lastWriteTime INTEGER NOT NULL',
    'data json NOT NULL',
] as const;

export const ATTACHMENTS_TABLE_COLUMNS = [
    'docIdWithAttachmentId TEXT PRIMARY KEY NOT NULL',
    'digest TEXT NOT NULL',
    'length INTEGER NOT NULL',
    'type TEXT NOT NULL',
    'data BLOB NOT NULL',
] as const;

/**
 * Database connection pool - keyed by database name
 */
const connectionPool = new WeakMap<SQLiteBasics<any>, Map<string, SQLiteConnectionState>>();

export function getDatabaseConnection<DatabaseType>(
    basics: SQLiteBasics<DatabaseType>,
    name: string
): Promise<DatabaseType> {
    let pool = connectionPool.get(basics);
    if (!pool) {
        pool = new Map();
        connectionPool.set(basics, pool);
    }

    const existing = pool.get(name);
    if (existing) {
        existing.refCount++;
        return Promise.resolve(existing.db);
    }

    return basics.open(name).then(async (db) => {
        const state: SQLiteConnectionState<DatabaseType> = { db, refCount: 1 };
        pool!.set(name, state);

        // Set default pragmas
        await basics.setPragma(db, 'journal_mode', basics.journalMode || 'WAL');
        await basics.setPragma(db, 'foreign_keys', 'ON');

        return db;
    });
}

export async function closeDatabaseConnection<DatabaseType>(
    basics: SQLiteBasics<DatabaseType>,
    name: string
): Promise<void> {
    const pool = connectionPool.get(basics);
    if (!pool) return;

    const state = pool.get(name);
    if (!state) return;

    state.refCount--;
    if (state.refCount <= 0) {
        pool.delete(name);
        await basics.close(state.db);
    }
}

/**
 * Serial transaction queue per database connection.
 * Ensures only one transaction runs at a time per database.
 */
const transactionQueues = new WeakMap<object, Promise<any>>();

export async function sqliteTransaction<DatabaseType, T>(
    db: DatabaseType,
    basics: SQLiteBasics<DatabaseType>,
    fn: () => Promise<T>
): Promise<T> {
    const dbObj = db as object;
    const prev = transactionQueues.get(dbObj) || Promise.resolve();
    const next = prev.then(async () => {
        await basics.run(db, { query: 'BEGIN TRANSACTION', params: [] });
        try {
            const result = await fn();
            await basics.run(db, { query: 'COMMIT', params: [] });
            return result;
        } catch (err) {
            await basics.run(db, { query: 'ROLLBACK', params: [] }).catch(() => { });
            throw err;
        }
    });
    transactionQueues.set(dbObj, next.catch(() => { }));
    return next;
}

/**
 * Create main document table
 */
export function getCreateTableSQL(
    tableName: string,
    withoutRowid: boolean = false
): SQLiteQuery {
    const cols = MAIN_TABLE_COLUMNS.join(', ');
    const suffix = withoutRowid ? ' WITHOUT ROWID' : '';
    return {
        query: `CREATE TABLE IF NOT EXISTS "${tableName}" (${cols})${suffix}`,
        params: [],
    };
}

/**
 * Create attachments table
 */
export function getCreateAttachmentsTableSQL(
    tableName: string,
    withoutRowid: boolean = false
): SQLiteQuery {
    const cols = ATTACHMENTS_TABLE_COLUMNS.join(', ');
    const suffix = withoutRowid ? ' WITHOUT ROWID' : '';
    return {
        query: `CREATE TABLE IF NOT EXISTS "${tableName}_attachments" (${cols})${suffix}`,
        params: [],
    };
}

/**
 * Create index on a column
 */
export function getCreateIndexSQL(
    tableName: string,
    indexName: string,
    columns: string[]
): SQLiteQuery {
    const colList = columns.join(', ');
    return {
        query: `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${colList})`,
        params: [],
    };
}

/**
 * Extracts a JSON field path for use in SQL.
 * Returns the column name directly for known columns, or JSON_EXTRACT for nested paths.
 */
export function getJsonExtract(primaryPath: string, path: string): string {
    if (path === primaryPath) {
        return 'id';
    }
    if (path === '_meta.lwt') {
        return 'lastWriteTime';
    }
    if (path === '_deleted') {
        return 'deleted';
    }
    if (path === '_rev') {
        return 'revision';
    }
    return `JSON_EXTRACT(data, '$.${path}')`;
}

/**
 * Chunk an array into batches respecting SQLITE_VARIABLES_LIMIT
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Builds a parameterized IN clause
 */
export function buildInClause(count: number): string {
    return '(' + Array(count).fill(PARAM_KEY).join(', ') + ')';
}

/**
 * Encode data for storage
 */
export function docDataToSQLiteRow(
    primaryPath: string,
    docData: any
): {
    id: string;
    revision: string;
    deleted: number;
    lastWriteTime: number;
    data: string;
} {
    return {
        id: (docData as any)[primaryPath],
        revision: docData._rev,
        deleted: docData._deleted ? 1 : 0,
        lastWriteTime: docData._meta.lwt,
        data: JSON.stringify(docData),
    };
}

/**
 * Decode a SQLite row back to document data
 */
export function sqliteRowToDocData(row: any): any {
    return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
}
