import type {
  FilledMangoQuery,
  MangoQuerySelector,
  RxDocumentData,
  RxJsonSchema,
} from 'rxdb';

import { id } from './sql-builder';
import type { SQLiteBindValue } from './types';

export interface QueryResult {
  sql: string;
  params: SQLiteBindValue[];
  /**
   * If true, the SQL result must be further filtered in JS
   * (e.g. for $regex that cannot be expressed in SQL).
   */
  needsJsFilter: boolean;
}

/**
 * Build a SQL query from a FilledMangoQuery.
 */
export function buildQuery<RxDocType>(
  tableName: string,
  schema: RxJsonSchema<RxDocumentData<RxDocType>>,
  query: FilledMangoQuery<RxDocType>,
  mode: 'select' | 'count',
): QueryResult {
  const primaryPath = (typeof schema.primaryKey === 'string'
    ? schema.primaryKey
    : (schema.primaryKey as { key: string }).key) as string;

  const params: SQLiteBindValue[] = [];
  let needsJsFilter = false;

  // Build WHERE clause from selector
  const { sql: whereClause, hasRegex } = buildSelector(
    query.selector as MangoQuerySelector<Record<string, unknown>>,
    primaryPath,
    params,
  );
  if (hasRegex) needsJsFilter = true;

  const tbl = id(tableName);
  let sqlText: string;

  if (mode === 'count') {
    // count ignores sort, skip, limit
    sqlText = `SELECT COUNT(*) as count FROM ${tbl.quoted} WHERE ${whereClause}`;
  } else {
    sqlText = `SELECT data FROM ${tbl.quoted} WHERE ${whereClause}`;

    // ORDER BY
    if (query.sort && query.sort.length > 0) {
      const orderParts = query.sort.map((sortPart) => {
        const key = Object.keys(sortPart)[0] as string;
        const rawDir = (
          sortPart as Record<string, string>
        )[key]!.toUpperCase();
        // Whitelist direction to prevent injection
        const direction = rawDir === 'DESC' ? 'DESC' : 'ASC';
        const field = fieldToSql(key, primaryPath);
        params.push(...field.params);
        return `${field.expr} ${direction}`;
      });
      sqlText += ` ORDER BY ${orderParts.join(', ')}`;
    }

    // LIMIT / OFFSET
    if (query.limit !== undefined && query.limit !== null) {
      sqlText += ` LIMIT ?`;
      params.push(query.limit);
    }
    if (query.skip > 0) {
      if (query.limit === undefined || query.limit === null) {
        // SQLite requires LIMIT before OFFSET; use -1 for unlimited
        sqlText += ` LIMIT -1`;
      }
      sqlText += ` OFFSET ?`;
      params.push(query.skip);
    }
  }

  return { sql: sqlText, params, needsJsFilter };
}

/**
 * A field expression with its SQL text and any associated params.
 * For built-in columns (id, deleted, etc.) params is empty.
 * For JSON fields, params contains the JSON path (parameterized).
 */
interface FieldExpr {
  expr: string;
  params: SQLiteBindValue[];
}

/**
 * Map a document field path to a SQL expression.
 * Special fields map to dedicated columns; others use JSON_EXTRACT
 * with a parameterized path to prevent injection.
 */
function fieldToSql(fieldPath: string, primaryPath: string): FieldExpr {
  if (fieldPath === primaryPath)
    return { expr: '"id"', params: [] };
  if (fieldPath === '_deleted')
    return { expr: '"deleted"', params: [] };
  if (fieldPath === '_rev')
    return { expr: '"revision"', params: [] };
  if (fieldPath === '_meta.lwt')
    return { expr: '"lwt"', params: [] };

  // JSON path is parameterized — no string interpolation
  return {
    expr: 'JSON_EXTRACT("data", ?)',
    params: [`$.${fieldPath}`],
  };
}

/**
 * Convert a value to a SQLite-compatible bind value.
 * Handles boolean → integer conversion needed by SQLite.
 */
function toSqlValue(
  value: unknown,
  fieldPath: string,
): SQLiteBindValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') {
    // _deleted is stored as INTEGER 0/1 in the column;
    // JSON_EXTRACT also returns 1/0 for boolean JSON values.
    return value ? 1 : 0;
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;

  // Fallback: serialize to string (shouldn't normally happen)
  void fieldPath;
  return String(value);
}

interface SelectorResult {
  sql: string;
  hasRegex: boolean;
}

/**
 * Recursively build a WHERE clause from a MangoQuerySelector.
 */
function buildSelector(
  selector: MangoQuerySelector<Record<string, unknown>>,
  primaryPath: string,
  params: SQLiteBindValue[],
): SelectorResult {
  const conditions: string[] = [];
  let hasRegex = false;

  for (const key of Object.keys(selector)) {
    const value = (selector as Record<string, unknown>)[key];

    if (key === '$and') {
      const parts = (
        value as MangoQuerySelector<Record<string, unknown>>[]
      ).map((sub) => buildSelector(sub, primaryPath, params));
      const subConditions = parts.map((p) => p.sql).filter(Boolean);
      if (subConditions.length > 0) {
        conditions.push(`(${subConditions.join(' AND ')})`);
      }
      if (parts.some((p) => p.hasRegex)) hasRegex = true;
      continue;
    }

    if (key === '$or') {
      const parts = (
        value as MangoQuerySelector<Record<string, unknown>>[]
      ).map((sub) => buildSelector(sub, primaryPath, params));
      const subConditions = parts.map((p) => p.sql).filter(Boolean);
      if (subConditions.length > 0) {
        conditions.push(`(${subConditions.join(' OR ')})`);
      }
      if (parts.some((p) => p.hasRegex)) hasRegex = true;
      continue;
    }

    if (key === '$nor') {
      const parts = (
        value as MangoQuerySelector<Record<string, unknown>>[]
      ).map((sub) => buildSelector(sub, primaryPath, params));
      const subConditions = parts.map((p) => p.sql).filter(Boolean);
      if (subConditions.length > 0) {
        conditions.push(`NOT (${subConditions.join(' OR ')})`);
      }
      if (parts.some((p) => p.hasRegex)) hasRegex = true;
      continue;
    }

    if (key === '$not') {
      const sub = buildSelector(
        value as MangoQuerySelector<Record<string, unknown>>,
        primaryPath,
        params,
      );
      if (sub.sql) {
        conditions.push(`NOT (${sub.sql})`);
      }
      if (sub.hasRegex) hasRegex = true;
      continue;
    }

    // Field-level conditions
    const field = fieldToSql(key, primaryPath);

    if (value === null || value === undefined) {
      params.push(...field.params);
      conditions.push(`${field.expr} IS NULL`);
      continue;
    }

    if (typeof value !== 'object' || value instanceof RegExp) {
      // Implicit $eq
      if (value instanceof RegExp) {
        // $regex can't be expressed in SQL; skip and mark for JS filter
        hasRegex = true;
        continue;
      }
      params.push(...field.params);
      conditions.push(`${field.expr} = ?`);
      params.push(toSqlValue(value, key));
      continue;
    }

    // Operator object: { $gt: 5, $lt: 10 }
    const operators = value as Record<string, unknown>;
    for (const op of Object.keys(operators)) {
      const opValue = operators[op];

      switch (op) {
        case '$eq':
          params.push(...field.params);
          if (opValue === null) {
            conditions.push(`${field.expr} IS NULL`);
          } else {
            conditions.push(`${field.expr} = ?`);
            params.push(toSqlValue(opValue, key));
          }
          break;

        case '$ne':
          params.push(...field.params);
          if (opValue === null) {
            conditions.push(`${field.expr} IS NOT NULL`);
          } else {
            conditions.push(`${field.expr} <> ?`);
            params.push(toSqlValue(opValue, key));
          }
          break;

        case '$gt':
          params.push(...field.params);
          conditions.push(`${field.expr} > ?`);
          params.push(toSqlValue(opValue, key));
          break;

        case '$gte':
          params.push(...field.params);
          conditions.push(`${field.expr} >= ?`);
          params.push(toSqlValue(opValue, key));
          break;

        case '$lt':
          params.push(...field.params);
          conditions.push(`${field.expr} < ?`);
          params.push(toSqlValue(opValue, key));
          break;

        case '$lte':
          params.push(...field.params);
          conditions.push(`${field.expr} <= ?`);
          params.push(toSqlValue(opValue, key));
          break;

        case '$in': {
          const arr = opValue as unknown[];
          if (arr.length === 0) {
            conditions.push('0 = 1');
          } else {
            params.push(...field.params);
            const placeholders = arr.map(() => '?').join(', ');
            conditions.push(`${field.expr} IN (${placeholders})`);
            for (const item of arr) {
              params.push(toSqlValue(item, key));
            }
          }
          break;
        }

        case '$nin': {
          const arr = opValue as unknown[];
          if (arr.length === 0) {
            // NOT IN () is always true, skip
          } else {
            params.push(...field.params);
            const placeholders = arr.map(() => '?').join(', ');
            conditions.push(
              `${field.expr} NOT IN (${placeholders})`,
            );
            for (const item of arr) {
              params.push(toSqlValue(item, key));
            }
          }
          break;
        }

        case '$exists':
          params.push(...field.params);
          if (opValue) {
            conditions.push(`${field.expr} IS NOT NULL`);
          } else {
            conditions.push(`${field.expr} IS NULL`);
          }
          break;

        case '$regex': {
          params.push(...field.params);
          // Convert simple regex patterns to LIKE;
          // complex patterns fall back to JS filter.
          const pattern = String(opValue);
          if (pattern.startsWith('^') && pattern.endsWith('$')) {
            // Exact match: ^foo$ → = 'foo'
            conditions.push(`${field.expr} = ?`);
            params.push(pattern.slice(1, -1));
          } else if (pattern.startsWith('^')) {
            // Prefix match: ^foo → LIKE 'foo%'
            conditions.push(`${field.expr} LIKE ?`);
            params.push(pattern.slice(1) + '%');
          } else if (pattern.endsWith('$')) {
            // Suffix match: foo$ → LIKE '%foo'
            conditions.push(`${field.expr} LIKE ?`);
            params.push('%' + pattern.slice(0, -1));
          } else {
            // Contains match: foo → LIKE '%foo%'
            conditions.push(`${field.expr} LIKE ?`);
            params.push('%' + pattern + '%');
          }
          break;
        }

        case '$options':
          // Handled alongside $regex
          break;

        case '$type':
          params.push(...field.params);
          conditions.push(`typeof(${field.expr}) = ?`);
          params.push(toSqlValue(opValue, key));
          break;

        case '$size':
          params.push(...field.params);
          conditions.push(`JSON_ARRAY_LENGTH(${field.expr}) = ?`);
          params.push(toSqlValue(opValue, key));
          break;

        default:
          // Unknown operator; mark for JS post-filter
          hasRegex = true;
          break;
      }
    }
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1 = 1',
    hasRegex,
  };
}
