import type {
    MangoQuery,
    MangoQuerySelector,
    MangoQuerySortPart,
    RxDocumentData,
    RxJsonSchema,
} from 'rxdb';
import {
    getPrimaryFieldOfPrimaryKey,
} from 'rxdb';
import {
    getJsonExtract,
    PARAM_KEY,
    NON_IMPLEMENTED_OPERATOR_QUERY_BATCH_SIZE,
} from './sqlite-helpers';
import type { MangoQuerySQL } from './types';

/**
 * Convert a MangoQuery selector to a SQL WHERE clause.
 */
export function mangoQuerySelectorToSQL(
    primaryPath: string,
    selector: MangoQuerySelector<any>,
    params: any[]
): string {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(selector)) {
        if (key.startsWith('$')) {
            // Logical operators
            switch (key) {
                case '$and': {
                    const parts = (value as MangoQuerySelector<any>[]).map(
                        (sub) => mangoQuerySelectorToSQL(primaryPath, sub, params)
                    );
                    if (parts.length > 0) {
                        conditions.push('(' + parts.join(' AND ') + ')');
                    }
                    break;
                }
                case '$or': {
                    const parts = (value as MangoQuerySelector<any>[]).map(
                        (sub) => mangoQuerySelectorToSQL(primaryPath, sub, params)
                    );
                    if (parts.length > 0) {
                        conditions.push('(' + parts.join(' OR ') + ')');
                    }
                    break;
                }
                case '$nor': {
                    const parts = (value as MangoQuerySelector<any>[]).map(
                        (sub) => mangoQuerySelectorToSQL(primaryPath, sub, params)
                    );
                    if (parts.length > 0) {
                        conditions.push('NOT (' + parts.join(' OR ') + ')');
                    }
                    break;
                }
                case '$not': {
                    const sub = mangoQuerySelectorToSQL(primaryPath, value as MangoQuerySelector<any>, params);
                    conditions.push('NOT (' + sub + ')');
                    break;
                }
                default:
                    break;
            }
        } else {
            // Field-level operators
            const fieldSQL = getJsonExtract(primaryPath, key);

            if (value === null || value === undefined) {
                conditions.push(`${fieldSQL} IS NULL`);
            } else if (typeof value !== 'object' || Array.isArray(value)) {
                // Direct equality
                conditions.push(`${fieldSQL} = ${PARAM_KEY}`);
                params.push(value);
            } else {
                // Operator object
                for (const [op, opValue] of Object.entries(value as Record<string, any>)) {
                    switch (op) {
                        case '$eq':
                            if (opValue === null) {
                                conditions.push(`${fieldSQL} IS NULL`);
                            } else {
                                conditions.push(`${fieldSQL} = ${PARAM_KEY}`);
                                params.push(opValue);
                            }
                            break;
                        case '$ne':
                            if (opValue === null) {
                                conditions.push(`${fieldSQL} IS NOT NULL`);
                            } else {
                                conditions.push(`${fieldSQL} != ${PARAM_KEY}`);
                                params.push(opValue);
                            }
                            break;
                        case '$gt':
                            conditions.push(`${fieldSQL} > ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        case '$gte':
                            conditions.push(`${fieldSQL} >= ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        case '$lt':
                            conditions.push(`${fieldSQL} < ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        case '$lte':
                            conditions.push(`${fieldSQL} <= ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        case '$in': {
                            const arr = opValue as any[];
                            if (arr.length === 0) {
                                conditions.push('0 = 1'); // Always false
                            } else {
                                const placeholders = arr.map(() => PARAM_KEY).join(', ');
                                conditions.push(`${fieldSQL} IN (${placeholders})`);
                                params.push(...arr);
                            }
                            break;
                        }
                        case '$nin': {
                            const arr = opValue as any[];
                            if (arr.length === 0) {
                                // Always true, no condition needed
                            } else {
                                const placeholders = arr.map(() => PARAM_KEY).join(', ');
                                conditions.push(`${fieldSQL} NOT IN (${placeholders})`);
                                params.push(...arr);
                            }
                            break;
                        }
                        case '$exists':
                            if (opValue) {
                                conditions.push(`${fieldSQL} IS NOT NULL`);
                            } else {
                                conditions.push(`${fieldSQL} IS NULL`);
                            }
                            break;
                        case '$type':
                            conditions.push(`typeof(${fieldSQL}) = ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        case '$regex': {
                            // SQLite LIKE approximation for simple patterns
                            let pattern = opValue as string;
                            const flags = (value as any).$options || '';
                            // Convert basic regex to LIKE
                            if (pattern.startsWith('^') && pattern.endsWith('$')) {
                                pattern = pattern.slice(1, -1);
                                conditions.push(`${fieldSQL} = ${PARAM_KEY}`);
                                params.push(pattern);
                            } else if (pattern.startsWith('^')) {
                                pattern = pattern.slice(1);
                                conditions.push(`${fieldSQL} LIKE ${PARAM_KEY}`);
                                params.push(pattern + '%');
                            } else if (pattern.endsWith('$')) {
                                pattern = pattern.slice(0, -1);
                                conditions.push(`${fieldSQL} LIKE ${PARAM_KEY}`);
                                params.push('%' + pattern);
                            } else {
                                conditions.push(`${fieldSQL} LIKE ${PARAM_KEY}`);
                                params.push('%' + pattern + '%');
                            }
                            break;
                        }
                        case '$options':
                            // Handled in $regex
                            break;
                        case '$elemMatch': {
                            // Not natively supported in SQLite JSON
                            // Use JSON_EXTRACT with approximate matching
                            conditions.push(`${fieldSQL} IS NOT NULL`);
                            break;
                        }
                        case '$size': {
                            conditions.push(`JSON_ARRAY_LENGTH(${fieldSQL}) = ${PARAM_KEY}`);
                            params.push(opValue);
                            break;
                        }
                        default:
                            // Unknown operator - skip, handled in post-filter
                            break;
                    }
                }
            }
        }
    }

    if (conditions.length === 0) {
        return '1 = 1';
    }
    return conditions.join(' AND ');
}

/**
 * Convert MangoQuery sort to SQL ORDER BY clause.
 */
export function mangoQuerySortToSQL(
    primaryPath: string,
    sort: MangoQuerySortPart<any>[]
): string {
    if (!sort || sort.length === 0) {
        return '';
    }

    const parts = sort.map((sortPart) => {
        const [field, direction] = Object.entries(sortPart)[0];
        const fieldSQL = getJsonExtract(primaryPath, field);
        return `${fieldSQL} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
    });

    return 'ORDER BY ' + parts.join(', ');
}

/**
 * Prepare a MangoQuery for execution against SQLite.
 * Returns SQL query string and parameters.
 */
export function prepareSQLiteQuery<RxDocType>(
    schema: RxJsonSchema<RxDocumentData<RxDocType>>,
    query: MangoQuery<RxDocType>,
    tableName: string
): MangoQuerySQL {
    const primaryPath = getPrimaryFieldOfPrimaryKey(schema.primaryKey) as string;
    const params: any[] = [];

    // Build WHERE clause from selector
    const selector = query.selector || {};
    const whereClause = mangoQuerySelectorToSQL(primaryPath, selector as MangoQuerySelector<any>, params);

    // Build ORDER BY from sort
    const sort = query.sort || [];
    const orderByClause = mangoQuerySortToSQL(primaryPath, sort);

    // Build LIMIT
    const limitClause = query.limit ? `LIMIT ${query.limit}` : '';

    // Build SKIP
    const skipClause = query.skip ? `OFFSET ${query.skip}` : '';

    // Assemble SQL
    const sqlQuery = [
        `SELECT data FROM "${tableName}"`,
        `WHERE ${whereClause}`,
        orderByClause,
        limitClause,
        skipClause,
    ].filter(Boolean).join(' ');

    const countQuery = [
        `SELECT COUNT(*) as count FROM "${tableName}"`,
        `WHERE ${whereClause}`,
    ].filter(Boolean).join(' ');

    // Clone params for count query (same WHERE clause)
    const countParams = [...params];

    return {
        sqlQuery,
        sqlParams: params,
        countQuery,
        countParams,
    };
}
