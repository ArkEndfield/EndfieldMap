import type { RxStorageDefaultCheckpoint } from 'rxdb';

/**
 * Minimal interface for the expo-sqlite database methods we use.
 * Avoids type identity issues with duplicate expo-sqlite installations
 * across workspace packages.
 */
export interface SQLiteDatabaseLike {
  execSync(source: string): void;
  runSync(source: string, ...params: unknown[]): { changes: number; lastInsertRowId: number };
  getFirstSync<T>(source: string, ...params: unknown[]): T | null;
  getAllSync<T>(source: string, ...params: unknown[]): T[];
  withTransactionSync(task: () => void): void;
}

/**
 * Internal state of a storage instance.
 */
export interface ExpoSQLiteInternals {
  db: SQLiteDatabaseLike;
  tableName: string;
  attachmentTableName: string;
  closed: boolean;
}

/**
 * Instance creation options (empty, reserved for future use).
 */
export type ExpoSQLiteInstanceCreationOptions = Record<string, never>;

/**
 * Options for the storage factory.
 */
export interface ExpoSQLiteStorageOptions {
  /**
   * An expo-sqlite database instance, opened and managed by the caller.
   * The caller controls the database lifecycle and PRAGMA settings.
   */
  database: SQLiteDatabaseLike;
}

/**
 * Reuse RxDB's built-in checkpoint type.
 */
export type ExpoSQLiteCheckpoint = RxStorageDefaultCheckpoint;

/**
 * SQL parameter types accepted by expo-sqlite.
 */
export type SQLiteBindValue = string | number | null;
