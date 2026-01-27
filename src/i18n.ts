import { getVersionInfo } from '@endfieldmap/tools';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { languageConfig } from '@/const/language';
import { LoadingStageId } from '@/const/loading';
import { isDev } from '@/services/env';
import { loadingManager } from '@/services/loading';

const ns = ['common', 'error', 'header', 'lang', 'popup', 'sidebar', 'settings'];
const supportedLngs = languageConfig.map((lang) => lang.code);
// 标志位：防止语言切换等情况导致进度回退
let initialLoadComplete = false;

const { commitHash } = getVersionInfo();

i18n
  // load translation using http -> see /public/locales
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init(
    {
      load: 'currentOnly',
      supportedLngs,
      fallbackLng: 'zh-CN',
      ns: ns,
      defaultNS: 'common',
      debug: isDev,
      returnEmptyString: false,
      backend: {
        queryStringParams: {
          v: commitHash,
        },
      },
    },
    () => {
      i18n.loadNamespaces(ns).then(() => {
        // LOADING
        loadingManager.completeStage(LoadingStageId.I18N);
        initialLoadComplete = true;
      });
    }
  );

// 监听每个命名空间的加载（仅在初次加载时更新进度）
i18n.on(
  'loaded',
  (loaded: {
    [language: string]: {
      [namespace: string]: boolean;
    };
  }) => {
    // 初次加载完成后不再更新进度，防止语言切换导致进度回退
    if (initialLoadComplete) return;

    const loadedCount = Object.keys(loaded).length;
    const progress = (loadedCount / ns.length) * 100;
    // LOADING
    loadingManager.updateStageProgress(LoadingStageId.I18N, progress);
  }
);

export default i18n;
