import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { isDev } from '@/services/env';
import { loadingManager, LoadingStageId } from '@/services/loading';

const ns = ['common', 'header', 'map', 'popup', 'sidebar', 'settings'];
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
      fallbackLng: 'cn',
      ns: ns,
      defaultNS: 'common',
      debug: isDev,
    },
    () => {
      i18n.loadNamespaces(ns).then(() => {
        // LOADING
        loadingManager.completeStage(LoadingStageId.I18N);
      });
    }
  );

// 监听每个命名空间的加载
i18n.on('loaded', (loaded: {
    [language: string]: {
        [namespace: string]: boolean;
    };
}) => {
  const loadedCount = Object.keys(loaded).length;
  const progress = (loadedCount / ns.length) * 100;
  // LOADING
  loadingManager.updateStageProgress(LoadingStageId.I18N, progress);
});

export default i18n;
