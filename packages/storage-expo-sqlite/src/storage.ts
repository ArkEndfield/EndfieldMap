import type {
  RxStorage,
  RxStorageInstance,
  RxStorageInstanceCreationParams,
} from 'rxdb';
import { ensureRxStorageInstanceParamsAreCorrect,RXDB_VERSION } from 'rxdb';

import { createExpoSQLiteStorageInstance } from './storage-instance';
import type {
  ExpoSQLiteCheckpoint,
  ExpoSQLiteInstanceCreationOptions,
  ExpoSQLiteInternals,
  ExpoSQLiteStorageOptions,
} from './types';

export const STORAGE_NAME = 'expo-sqlite';

export class RxStorageExpoSQLite
  implements RxStorage<ExpoSQLiteInternals, ExpoSQLiteInstanceCreationOptions>
{
  readonly name = STORAGE_NAME;
  readonly rxdbVersion = RXDB_VERSION;

  constructor(private readonly options: ExpoSQLiteStorageOptions) {}

  async createStorageInstance<RxDocType>(
    params: RxStorageInstanceCreationParams<
      RxDocType,
      ExpoSQLiteInstanceCreationOptions
    >,
  ): Promise<
    RxStorageInstance<
      RxDocType,
      ExpoSQLiteInternals,
      ExpoSQLiteInstanceCreationOptions,
      ExpoSQLiteCheckpoint
    >
  > {
    ensureRxStorageInstanceParamsAreCorrect(params);
    return createExpoSQLiteStorageInstance(params, this.options);
  }
}

export function getRxStorageExpoSQLite(
  options: ExpoSQLiteStorageOptions,
): RxStorageExpoSQLite {
  return new RxStorageExpoSQLite(options);
}
