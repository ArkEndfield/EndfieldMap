import { createI18n } from 'vue-i18n';
import { loadJSON } from '@/utils/jsonLoader';
import zhCN from './locales/zh-cn.json';
import rewardZhCN from './locales/item_i18n_cn.json';
import characterZhCN from './locales/character_i18n_cn.json';
import dungeonZhCN from './locales/dungeon_series_i18n_cn.json';
import enemyZhCN from './locales/enemy_template_i18n_cn.json';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import { refreshMap } from '@/services/MapCore';
import { rafTimeout } from '@/utils/animationTimer';

const zhCNLang = {
  ...zhCN,
  item: rewardZhCN,
  character: characterZhCN,
  dungeon: dungeonZhCN,
  enemy: enemyZhCN,
};

const KEY = LOCAL_STORAGE_KEY.LANGUAGE;

export type MessageSchema = typeof zhCNLang;

export type Language = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';

const storagedLocale = localStorage.getItem(KEY);

export const setLanguage = (lang: Language) => {
  localStorage.setItem(KEY, lang);
  if (lang !== 'zh-CN') {
    loadLanguage(lang).catch(console.error);
  }
  i18n.global.locale.value = lang;
  rafTimeout(refreshMap, 0);
};

export const resetLanguage = () => {
  localStorage.removeItem(KEY);
  rafTimeout(refreshMap, 0);
};

export const getLanguage = () => {
  const lang = localStorage.getItem(KEY);
  if (lang) {
    return lang;
  }
  return 'zh-CN';
};

const i18n = createI18n({
  locale: (storagedLocale as Language) || window.navigator.language,
  fallbackLocale: 'zh-CN',
  legacy: false,
  messages: {
    'zh-CN': zhCNLang,
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
    'ja-JP': {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      },
    },
    'ko-KR': {
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
    'ja-JP': {
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
    'ko-KR': {
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

    let rewardLang = 'cn';

    if (lang === 'zh-TW') {
      rewardLang = 'tc';
    } else if (lang === 'en-US') {
      rewardLang = 'en';
    } else if (lang === 'ja-JP') {
      rewardLang = 'jp';
    } else if (lang === 'ko-KR') {
      rewardLang = 'kr';
    } else if (lang === 'ko-KR') {
      rewardLang = 'kr';
    }

    const loadLangBase = loadJSON<MessageSchema>(
      `/locales/${lang.toLowerCase()}.json`
    );
    const loadLangItem = loadJSON<MessageSchema>(
      `/locales/item_i18n_${rewardLang}.json`
    );
    const loadLangCharacter = loadJSON<MessageSchema>(
      `/locales/character_i18n_${rewardLang}.json`
    );
    const loadLangDungeon = loadJSON<MessageSchema>(
      `/locales/dungeon_series_i18n_${rewardLang}.json`
    );
    const loadLangEnemy = loadJSON<MessageSchema>(
      `/locales/enemy_template_i18n_${rewardLang}.json`
    );

    const messages = await Promise.all([
      loadLangBase,
      loadLangItem,
      loadLangCharacter,
      loadLangDungeon,
      loadLangEnemy,
    ]).then(([base, item, character, dungeon, enemy]) => {
      return {
        ...base,
        item,
        character,
        dungeon,
        enemy,
      } as unknown as MessageSchema;
    });
    if (i18n.global.availableLocales.includes(lang)) {
      i18n.global.mergeLocaleMessage(lang, messages);
    } else {
      i18n.global.setLocaleMessage(lang, messages);
    }
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
