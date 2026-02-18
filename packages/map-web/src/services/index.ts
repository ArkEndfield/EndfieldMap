import { MapService } from '@endfieldmap/map-service';
import { sentryReporter } from '@/services/logger';
import { isDev, backendHost, assetsHost } from '@/services/env';

import LanguageDetector from 'i18next-browser-languagedetector';
import { loadingManager } from '@/services/loading';
import { LoadingStageId } from '@/const/loading';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

let initialLoadComplete = false;

export const service = new MapService({
  consolaReporter: sentryReporter,
  isDev: isDev,
  i18nConfig: {
    hooks: [LanguageDetector],
    afterLoad: () => {
      loadingManager.completeStage(LoadingStageId.I18N);
      initialLoadComplete = true;
    },
    onLoaded: (ns, loaded) => {
      // 初次加载完成后不再更新进度，防止语言切换导致进度回退
      if (initialLoadComplete) return;

      const loadedCount = Object.keys(loaded).length;
      const progress = (loadedCount / ns.length) * 100;
      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.I18N, progress);
    },
  },
  databaseConfig: {
    storage: getRxStorageDexie(),
  },
  backendHost,
  assetsHost,
});
