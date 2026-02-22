/**
 * RxStorage SQLite Plugin
 *
 * A RxDB storage implementation backed by SQLite.
 * Works across platforms via the SQLiteBasics adapter interface.
 */

import type {
    RxStorage,
    RxStorageInstanceCreationParams,
} from 'rxdb';
import { RXDB_VERSION } from 'rxdb';

import type {
    SQLiteInternals,
    SQLiteSettings,
} from './types';
import { RX_STORAGE_NAME_SQLITE } from './sqlite-helpers';
import {
    RxStorageInstanceSQLite,
    createSQLiteStorageInstance,
} from './sqlite-storage-instance';

export class RxStorageSQLite implements RxStorage<SQLiteInternals, SQLiteSettings> {
    public readonly name = RX_STORAGE_NAME_SQLITE;
    public readonly rxdbVersion = RXDB_VERSION;

    constructor(
        public readonly settings: SQLiteSettings,
    ) { }

    async createStorageInstance<RxDocType>(
        params: RxStorageInstanceCreationParams<RxDocType, SQLiteSettings>,
    ): Promise<RxStorageInstanceSQLite<RxDocType>> {
        return createSQLiteStorageInstance(
            { name: this.name, rxdbVersion: this.rxdbVersion },
            params,
            this.settings,
        );
    }
}

/**
 * Factory function to create an RxStorageSQLite instance.
 */
export function getRxStorageSQLite(settings: SQLiteSettings): RxStorageSQLite {
    return new RxStorageSQLite(settings);
}

/**
 * Re-export everything for convenience.
 */
export {
    RX_STORAGE_NAME_SQLITE,
    SQLITE_VARIABLES_LIMIT,
    SQLITE_IN_MEMORY_DB_NAME,
    NON_IMPLEMENTED_OPERATOR_QUERY_BATCH_SIZE,
    PARAM_KEY,
    getJsonExtract,
    sqliteTransaction,
    getDatabaseConnection,
    closeDatabaseConnection,
} from './sqlite-helpers';

export {
    mangoQuerySelectorToSQL,
    mangoQuerySortToSQL,
    prepareSQLiteQuery,
} from './sqlite-query';

export {
    RxStorageInstanceSQLite,
    createSQLiteStorageInstance,
} from './sqlite-storage-instance';

export {
    getSQLiteBasicsNode,
    getSQLiteBasicsCapacitor,
    getSQLiteBasicsExpoSQLite,
    getSQLiteBasicsWasm,
    getSQLiteBasicsTauri,
    getSQLiteBasicsQuickSQLite,
} from './sqlite-basics';

export type {
    SQLiteBasics,
    SQLiteSettings,
    SQLiteInternals,
    SQLiteQuery,
    MangoQuerySQL,
    SQLiteStorageSettings,
    SQLiteConnectionState,
    SQLitePreparedQuery,
} from './types';
