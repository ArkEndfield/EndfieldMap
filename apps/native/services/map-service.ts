import { MmkvStorageAdapter } from '@endfieldmap/storage-mmkv';
import { getRxStorageExpoSQLite } from '@endfieldmap/storage-expo-sqlite';
import { MapService } from '@endfieldmap/map-service';
import { registerStorageAdapter } from '@endfieldmap/tools';
import * as SQLite from 'expo-sqlite';
import { initReactI18next } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';

import { NativeLanguageDetector } from './language-detector';
import { nativeResourceLoader } from './locale-resources';

// MMKV 用于 LocalStorageValue 等键值存储
const mmkv = createMMKV({ id: 'endfieldmap' });
registerStorageAdapter(new MmkvStorageAdapter(mmkv));

// SQLite 用于 RxDB 持久化存储
const db = SQLite.openDatabaseSync('endfieldmap_rxdb');
db.execSync('PRAGMA journal_mode=WAL');
db.execSync('PRAGMA synchronous=NORMAL');

const assetsHost = 'https://assets.fz.wiki';
const backendHost = 'https://api.zmdmap.com';

export const service = new MapService({
  databaseConfig: {
    storage: getRxStorageExpoSQLite({ database: db }),
  },
  i18nConfig: {
    resourceLoader: nativeResourceLoader,
    hooks: [NativeLanguageDetector, initReactI18next],
  },
  backendHost,
  assetsHost,
});
