import { createI18n } from 'vue-i18n';
import { loadJSON } from '@/utils/jsonLoader';
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
  },
  numberFormats: {
    'en-US': {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      },
    },
    'zh-CN': {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      },
    },
    'zh-TW': {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      },
    },
  },
  datetimeFormats: {
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
      },
    },
    'zh-CN': {
      short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'narrow',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      },
    },
    'zh-TW': {
      short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'narrow',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      },
    },
  },
});

export async function loadLanguage(lang: Language) {
  try {
    if (lang === 'zh-CN') {
      return true;
    }

    const messages = await loadJSON<MessageSchema>(
      `/locales/${lang.toLowerCase()}.json`
    );
    i18n.global.setLocaleMessage(lang, messages);
    return true;
  } catch (error) {
    console.error(`加载语言文件失败 ${lang}:`, error);
    return false;
  }
}

const currentLocale =
  (storagedLocale as Language) || (window.navigator.language as Language);
if (currentLocale !== 'zh-CN') {
  loadLanguage(currentLocale).catch(console.error);
}

export default i18n;
