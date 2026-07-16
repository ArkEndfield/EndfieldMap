import type { RxDocumentData } from 'rxdb';

import { id, sql } from './sql-builder';
import type { SQLiteDatabaseLike } from './types';

/**
 * Generate a table name from database/collection/version.
 */
export function getTableName(
  databaseName: string,
  collectionName: string,
  schemaVersion: number,
): string {
  return `${databaseName}--${collectionName}--${schemaVersion}`;
}

/**
 * Generate the attachment table name.
 */
export function getAttachmentTableName(tableName: string): string {
  return `${tableName}--attachments`;
}

/**
 * Create the document table, indexes, and attachment table.
 */
export function createTables(
  db: SQLiteDatabaseLike,
  tableName: string,
  attachmentTableName: string,
): void {
  const tbl = id(tableName);
  const attTbl = id(attachmentTableName);
  const idxDeletedLwt = id(`idx_${tableName}_deleted_lwt`);
  const idxLwtId = id(`idx_${tableName}_lwt_id`);

  db.execSync(
    sql`CREATE TABLE IF NOT EXISTS ${tbl} (
      id       TEXT NOT NULL PRIMARY KEY,
      data     TEXT NOT NULL,
      deleted  INTEGER NOT NULL DEFAULT 0,
      revision TEXT NOT NULL,
      lwt      REAL NOT NULL
    )`.text,
  );

  db.execSync(
    sql`CREATE INDEX IF NOT EXISTS ${idxDeletedLwt} ON ${tbl} (deleted, lwt)`
      .text,
  );
  db.execSync(
    sql`CREATE INDEX IF NOT EXISTS ${idxLwtId} ON ${tbl} (lwt, id)`.text,
  );

  db.execSync(
    sql`CREATE TABLE IF NOT EXISTS ${attTbl} (
      doc_id        TEXT NOT NULL,
      attachment_id TEXT NOT NULL,
      data          TEXT NOT NULL,
      digest        TEXT NOT NULL,
      length        INTEGER NOT NULL,
      type          TEXT NOT NULL,
      PRIMARY KEY (doc_id, attachment_id)
    )`.text,
  );
}

/**
 * Drop document and attachment tables.
 */
export function dropTables(
  db: SQLiteDatabaseLike,
  tableName: string,
  attachmentTableName: string,
): void {
  db.execSync(sql`DROP TABLE IF EXISTS ${id(tableName)}`.text);
  db.execSync(sql`DROP TABLE IF EXISTS ${id(attachmentTableName)}`.text);
}

// --- Row conversion helpers ---

function rowToDoc<RxDocType>(row: {
  data: string;
}): RxDocumentData<RxDocType> {
  return JSON.parse(row.data) as RxDocumentData<RxDocType>;
}

// --- Single document operations ---

export function getDocumentById<RxDocType>(
  db: SQLiteDatabaseLike,
  tableName: string,
  docId: string,
): RxDocumentData<RxDocType> | null {
  const q = sql`SELECT data FROM ${id(tableName)} WHERE id = ${docId}`;
  const row = db.getFirstSync<{ data: string }>(q.text, q.params);
  return row ? rowToDoc<RxDocType>(row) : null;
}

/**
 * Batch-fetch documents by IDs.
 * Splits into batches of 999 to respect SQLite parameter limits.
 */
export function getDocumentsByIds<RxDocType>(
  db: SQLiteDatabaseLike,
  tableName: string,
  ids: string[],
  primaryPath: string,
  withDeleted: boolean = true,
): Map<string, RxDocumentData<RxDocType>> {
  const result = new Map<string, RxDocumentData<RxDocType>>();
  if (ids.length === 0) return result;

  const tbl = id(tableName);
  const deletedSuffix = withDeleted ? '' : ' AND deleted = 0';
  const BATCH_SIZE = 999;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => '?').join(',');
    // Identifiers use the builder; values (batch) are already parameterized
    const q = `SELECT data FROM ${tbl.quoted} WHERE id IN (${placeholders})${deletedSuffix}`;
    const rows = db.getAllSync<{ data: string }>(q, batch);
    for (const row of rows) {
      const doc = rowToDoc<RxDocType>(row);
      const docId = String(
        (doc as Record<string, unknown>)[primaryPath],
      );
      result.set(docId, doc);
    }
  }
  return result;
}

export function insertDocument<RxDocType>(
  db: SQLiteDatabaseLike,
  tableName: string,
  doc: RxDocumentData<RxDocType>,
  primaryPath: string,
): void {
  const docId = String((doc as Record<string, unknown>)[primaryPath]);
  const q = sql`INSERT INTO ${id(tableName)} (id, data, deleted, revision, lwt) VALUES (${docId}, ${JSON.stringify(doc)}, ${doc._deleted ? 1 : 0}, ${doc._rev}, ${doc._meta.lwt})`;
  db.runSync(q.text, q.params);
}

export function updateDocument<RxDocType>(
  db: SQLiteDatabaseLike,
  tableName: string,
  doc: RxDocumentData<RxDocType>,
  primaryPath: string,
): void {
  const docId = String((doc as Record<string, unknown>)[primaryPath]);
  const q = sql`UPDATE ${id(tableName)} SET data = ${JSON.stringify(doc)}, deleted = ${doc._deleted ? 1 : 0}, revision = ${doc._rev}, lwt = ${doc._meta.lwt} WHERE id = ${docId}`;
  db.runSync(q.text, q.params);
}

export function deleteDocument(
  db: SQLiteDatabaseLike,
  tableName: string,
  docId: string,
): void {
  const q = sql`DELETE FROM ${id(tableName)} WHERE id = ${docId}`;
  db.runSync(q.text, q.params);
}

export function getAllDocuments<RxDocType>(
  db: SQLiteDatabaseLike,
  tableName: string,
  withDeleted: boolean,
): RxDocumentData<RxDocType>[] {
  const tbl = id(tableName);
  const q = withDeleted
    ? sql`SELECT data FROM ${tbl}`
    : sql`SELECT data FROM ${tbl} WHERE deleted = 0`;
  const rows = db.getAllSync<{ data: string }>(q.text, q.params);
  return rows.map((row) => rowToDoc<RxDocType>(row));
}

// --- Attachment operations ---

export function getAttachment(
  db: SQLiteDatabaseLike,
  attachmentTableName: string,
  docId: string,
  attachmentId: string,
  digest: string,
): { data: string; type: string } | null {
  const q = sql`SELECT data, type FROM ${id(attachmentTableName)} WHERE doc_id = ${docId} AND attachment_id = ${attachmentId} AND digest = ${digest}`;
  const row = db.getFirstSync<{ data: string; type: string }>(q.text, q.params);
  return row ? { data: row.data, type: row.type } : null;
}

export function setAttachment(
  db: SQLiteDatabaseLike,
  attachmentTableName: string,
  docId: string,
  attachmentId: string,
  data: string,
  digest: string,
  length: number,
  type: string,
): void {
  const q = sql`INSERT OR REPLACE INTO ${id(attachmentTableName)} (doc_id, attachment_id, data, digest, length, type) VALUES (${docId}, ${attachmentId}, ${data}, ${digest}, ${length}, ${type})`;
  db.runSync(q.text, q.params);
}

export function removeAttachment(
  db: SQLiteDatabaseLike,
  attachmentTableName: string,
  docId: string,
  attachmentId: string,
): void {
  const q = sql`DELETE FROM ${id(attachmentTableName)} WHERE doc_id = ${docId} AND attachment_id = ${attachmentId}`;
  db.runSync(q.text, q.params);
}

export function removeAllAttachments(
  db: SQLiteDatabaseLike,
  attachmentTableName: string,
  docId: string,
): void {
  const q = sql`DELETE FROM ${id(attachmentTableName)} WHERE doc_id = ${docId}`;
  db.runSync(q.text, q.params);
}
