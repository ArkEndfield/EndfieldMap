/**
 * Platform adapter implementations for SQLite.
 *
 * These are factory functions that return an SQLiteBasics object
 * for different runtime environments. Users pick the one matching
 * their platform.
 */

import type { SQLiteBasics, SQLiteQuery } from './types';

/**
 * Node.js adapter using better-sqlite3
 */
export function getSQLiteBasicsNode(betterSqlite3: any): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'node-better-sqlite3',
        async open(name: string) {
            const db = new betterSqlite3(name);
            return db;
        },
        async all(db: any, query: SQLiteQuery) {
            const stmt = db.prepare(query.query);
            return stmt.all(...query.params);
        },
        async run(db: any, query: SQLiteQuery) {
            const stmt = db.prepare(query.query);
            return stmt.run(...query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            db.pragma(`${key} = ${value}`);
        },
        async close(db: any) {
            db.close();
        },
    };
}

/**
 * Capacitor SQLite adapter (using @capacitor-community/sqlite)
 */
export function getSQLiteBasicsCapacitor(
    sqlite: any,
    options?: { ionicStorage?: boolean }
): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'capacitor-sqlite',
        async open(name: string) {
            const db = await sqlite.createConnection(name, false, 'no-encryption', 1);
            await db.open();
            return db;
        },
        async all(db: any, query: SQLiteQuery) {
            const result = await db.query(query.query, query.params);
            return result.values || [];
        },
        async run(db: any, query: SQLiteQuery) {
            return db.run(query.query, query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            await db.run(`PRAGMA ${key} = ${value}`, []);
        },
        async close(db: any) {
            await db.close();
        },
    };
}

/**
 * Expo SQLite adapter (using expo-sqlite)
 */
export function getSQLiteBasicsExpoSQLite(SQLite: any): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'expo-sqlite',
        async open(name: string) {
            return SQLite.openDatabaseAsync(name);
        },
        async all(db: any, query: SQLiteQuery) {
            return db.getAllAsync(query.query, query.params);
        },
        async run(db: any, query: SQLiteQuery) {
            return db.runAsync(query.query, query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            await db.runAsync(`PRAGMA ${key} = ${value}`, []);
        },
        async close(db: any) {
            await db.closeAsync();
        },
    };
}

/**
 * WebAssembly (wa-sqlite) adapter
 */
export function getSQLiteBasicsWasm(
    sqlite3: any,
    vfs?: any
): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'wasm-sqlite',
        async open(name: string) {
            const db = await sqlite3.open_v2(name);
            return db;
        },
        async all(db: any, query: SQLiteQuery) {
            const results: any[] = [];
            await sqlite3.exec(db, query.query, query.params, (row: any) => {
                results.push(row);
            });
            return results;
        },
        async run(db: any, query: SQLiteQuery) {
            return sqlite3.exec(db, query.query, query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            await sqlite3.exec(db, `PRAGMA ${key} = ${value}`);
        },
        async close(db: any) {
            await sqlite3.close(db);
        },
    };
}

/**
 * Tauri (tauri-plugin-sql) adapter
 */
export function getSQLiteBasicsTauri(Database: any): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'tauri-sqlite',
        async open(name: string) {
            return Database.load(`sqlite:${name}`);
        },
        async all(db: any, query: SQLiteQuery) {
            return db.select(query.query, query.params);
        },
        async run(db: any, query: SQLiteQuery) {
            return db.execute(query.query, query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            await db.execute(`PRAGMA ${key} = ${value}`);
        },
        async close(db: any) {
            await db.close();
        },
    };
}

/**
 * React Native Quick SQLite adapter (using react-native-quick-sqlite or op-sqlite)
 */
export function getSQLiteBasicsQuickSQLite(quickSqlite: any): SQLiteBasics<any> {
    return {
        journalMode: 'WAL',
        debugId: 'quick-sqlite',
        async open(name: string) {
            const db = quickSqlite.open(name);
            return db;
        },
        async all(db: any, query: SQLiteQuery) {
            const result = db.executeSql(query.query, query.params);
            return result.rows?._array || [];
        },
        async run(db: any, query: SQLiteQuery) {
            return db.executeSql(query.query, query.params);
        },
        async setPragma(db: any, key: string, value: string) {
            db.executeSql(`PRAGMA ${key} = ${value}`, []);
        },
        async close(db: any) {
            db.close();
        },
    };
}
