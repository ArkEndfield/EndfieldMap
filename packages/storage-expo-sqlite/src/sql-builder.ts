import type { SQLiteBindValue } from './types';

/**
 * Lightweight SQL builder using tagged template literals.
 *
 * Prevents SQL injection by design:
 * - Identifiers (table/index/column names) must be wrapped with `id()`,
 *   which escapes `"` → `""` inside double-quote delimiters.
 * - Values interpolated directly become `?` placeholders with bound params.
 * - Raw SQL fragments must be explicitly wrapped with `raw()`.
 *
 * @example
 * const tbl = id('my--table');
 * const q = sql`SELECT * FROM ${tbl} WHERE name = ${'Alice'} AND age > ${25}`;
 * // q.text  = 'SELECT * FROM "my--table" WHERE name = ? AND age > ?'
 * // q.params = ['Alice', 25]
 */

// --- Marker types ---

/** A safe SQL identifier (table name, column name, index name). */
export class SqlId {
  readonly quoted: string;
  constructor(name: string) {
    // Standard SQL escaping: double any embedded `"` inside `"..."` quoting
    this.quoted = `"${name.replace(/"/g, '""')}"`;
  }
}

/** A raw SQL fragment inserted as-is (use sparingly). */
export class SqlRaw {
  constructor(
    readonly text: string,
    readonly params: SQLiteBindValue[] = [],
  ) {}
}

// --- Factory functions ---

/** Create a safe SQL identifier. */
export function id(name: string): SqlId {
  return new SqlId(name);
}

/** Create a raw SQL fragment. Only for trusted static SQL. */
export function raw(text: string, params: SQLiteBindValue[] = []): SqlRaw {
  return new SqlRaw(text, params);
}

// --- Query result ---

export interface SqlQuery {
  readonly text: string;
  readonly params: SQLiteBindValue[];
}

// --- Tagged template ---

export type SqlPart = SqlId | SqlRaw | SqlQuery | SQLiteBindValue;

/**
 * Tagged template literal for building safe SQL queries.
 *
 * - `SqlId` values → quoted identifiers
 * - `SqlRaw` / `SqlQuery` values → inlined SQL text with merged params
 * - Primitive values (string, number, null) → `?` placeholders
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: SqlPart[]
): SqlQuery {
  let text = '';
  const params: SQLiteBindValue[] = [];

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      const val = values[i];
      if (val instanceof SqlId) {
        text += val.quoted;
      } else if (val instanceof SqlRaw) {
        text += val.text;
        params.push(...val.params);
      } else if (
        val !== null &&
        typeof val === 'object' &&
        'text' in val &&
        'params' in val
      ) {
        // SqlQuery (or compatible shape)
        text += val.text;
        params.push(...val.params);
      } else {
        // Primitive value → parameterized
        text += '?';
        params.push(val as SQLiteBindValue);
      }
    }
  }

  return { text, params };
}
