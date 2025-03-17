import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-cn.json';
import zhTW from './locales/zh-tw.json';
import enUS from './locales/en-us.json';

export type MessageSchema = typeof zhCN;
export type Language = 'zh-CN' | 'zh-TW' | 'en-US';
const storagedLocale = localStorage.getItem('userLanguage');

const i18n = createI18n({
  locale: (storagedLocale as Language) || window.navigator.language,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
  },
});

export default i18n;
