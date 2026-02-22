import type {
    RxDocumentData,
    RxJsonSchema,
} from 'rxdb';

/**
 * A SQL query tuple: [queryString, params[]]
 */
export type SQLiteQuery = {
    query: string;
    params: any[];
};

/**
 * Platform adapter interface for SQLite operations.
 * Each platform (Node, Capacitor, Expo, Wasm, Tauri, etc.)
 * must implement this interface.
 */
export interface SQLiteBasics<DatabaseType> {
    open(name: string): Promise<DatabaseType>;
    all(db: DatabaseType, query: SQLiteQuery): Promise<any[]>;
    run(db: DatabaseType, query: SQLiteQuery): Promise<any>;
    setPragma(db: DatabaseType, key: string, value: string): Promise<any>;
    close(db: DatabaseType): Promise<any>;
    journalMode?: string;
    debugId?: string;
}

export interface SQLiteSettings<DatabaseType = any> {
    sqliteBasics: SQLiteBasics<DatabaseType>;
    /**
     * If true, tables are created WITHOUT ROWID for better performance
     */
    withoutRowid?: boolean;
    /**
     * Optional logging wrapper
     */
    log?: boolean | ((msg: string) => void);
}

export interface SQLiteInternals<DatabaseType = any> {
    databasePromise: Promise<DatabaseType>;
}

export interface SQLitePreparedQuery<RxDocType> {
    query: MangoQuerySQL;
    schema: RxJsonSchema<RxDocumentData<RxDocType>>;
}

export interface MangoQuerySQL {
    sqlQuery: string;
    sqlParams: any[];
    countQuery: string;
    countParams: any[];
}

export interface SQLiteStorageSettings<DatabaseType = any> {
    sqliteBasics: SQLiteBasics<DatabaseType>;
    withoutRowid?: boolean;
    log?: boolean | ((msg: string) => void);
}

/**
 * Connection state for database pooling
 */
export interface SQLiteConnectionState<DatabaseType = any> {
    db: DatabaseType;
    refCount: number;
}
