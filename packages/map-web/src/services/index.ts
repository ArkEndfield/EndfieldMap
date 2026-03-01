import { MapService } from '@endfieldmap/map-service';
import { setAudioBaseUrl } from '@endfieldmap/web-components';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { LoadingStageId } from '@/const/loading';
import { assetsHost, backendHost, isDev } from '@/services/env';
import { loadingManager } from '@/services/loading';
import { sentryReporter } from '@/services/logger';

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  '../../../map-service/src/locales/**/*.json'
);

let initialLoadComplete = false;

export const service = new MapService({
  consolaReporter: sentryReporter,
  isDev: isDev,
  i18nConfig: {
    resourceLoader: (language: string, namespace: string) => {
      const key = `../../../map-service/src/locales/${language}/${namespace}.json`;
      const loader = localeModules[key];
      if (loader) return loader();
      return Promise.reject(new Error(`Missing locale: ${language}/${namespace}`));
    },
    hooks: [LanguageDetector, initReactI18next],
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

setAudioBaseUrl(service.assetService.url.audio);
