import { MmkvStorageAdapter } from '@endfieldmap/storage-mmkv';
import { MapService } from '@endfieldmap/map-service';
import { registerStorageAdapter } from '@endfieldmap/tools';
import { createMMKV } from 'react-native-mmkv';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

import { NativeLanguageDetector } from './language-detector';
import { nativeResourceLoader } from './locale-resources';

const mmkv = createMMKV({ id: 'endfieldmap' });
registerStorageAdapter(new MmkvStorageAdapter(mmkv));


const assetsHost = 'https://assets.zmdmap.com';
const backendHost = 'http://103.217.194.42:10086';

export const service = new MapService({
  databaseConfig: {
    storage: getRxStorageMemory(),
  },
  i18nConfig: {
    resourceLoader: nativeResourceLoader,
    hooks: [NativeLanguageDetector],
  },
  backendHost,
  assetsHost,
});
