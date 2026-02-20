/**
 * Native 端静态 locale 资源映射
 * Metro 不支持动态 import()/require() 模板字符串，需要完全静态的路径
 */
const resources: Record<string, Record<string, Record<string, unknown>>> = {
  'zh-CN': {
    common: require('../../map-service/src/locales/zh-CN/common.json'),
    error: require('../../map-service/src/locales/zh-CN/error.json'),
    header: require('../../map-service/src/locales/zh-CN/header.json'),
    lang: require('../../map-service/src/locales/zh-CN/lang.json'),
    popup: require('../../map-service/src/locales/zh-CN/popup.json'),
    sidebar: require('../../map-service/src/locales/zh-CN/sidebar.json'),
    settings: require('../../map-service/src/locales/zh-CN/settings.json'),
    agreement: require('../../map-service/src/locales/zh-CN/agreement.json'),
  },
  'zh-TW': {
    common: require('../../map-service/src/locales/zh-TW/common.json'),
    error: require('../../map-service/src/locales/zh-TW/error.json'),
    header: require('../../map-service/src/locales/zh-TW/header.json'),
    lang: require('../../map-service/src/locales/zh-TW/lang.json'),
    popup: require('../../map-service/src/locales/zh-TW/popup.json'),
    sidebar: require('../../map-service/src/locales/zh-TW/sidebar.json'),
    settings: require('../../map-service/src/locales/zh-TW/settings.json'),
    agreement: require('../../map-service/src/locales/zh-TW/agreement.json'),
  },
  'en-US': {
    common: require('../../map-service/src/locales/en-US/common.json'),
    error: require('../../map-service/src/locales/en-US/error.json'),
    header: require('../../map-service/src/locales/en-US/header.json'),
    lang: require('../../map-service/src/locales/en-US/lang.json'),
    popup: require('../../map-service/src/locales/en-US/popup.json'),
    sidebar: require('../../map-service/src/locales/en-US/sidebar.json'),
    settings: require('../../map-service/src/locales/en-US/settings.json'),
    agreement: require('../../map-service/src/locales/en-US/agreement.json'),
  },
  'ja-JP': {
    common: require('../../map-service/src/locales/ja-JP/common.json'),
    error: require('../../map-service/src/locales/ja-JP/error.json'),
    header: require('../../map-service/src/locales/ja-JP/header.json'),
    lang: require('../../map-service/src/locales/ja-JP/lang.json'),
    popup: require('../../map-service/src/locales/ja-JP/popup.json'),
    sidebar: require('../../map-service/src/locales/ja-JP/sidebar.json'),
    settings: require('../../map-service/src/locales/ja-JP/settings.json'),
    agreement: require('../../map-service/src/locales/ja-JP/agreement.json'),
  },
  'ko-KR': {
    common: require('../../map-service/src/locales/ko-KR/common.json'),
    error: require('../../map-service/src/locales/ko-KR/error.json'),
    header: require('../../map-service/src/locales/ko-KR/header.json'),
    lang: require('../../map-service/src/locales/ko-KR/lang.json'),
    popup: require('../../map-service/src/locales/ko-KR/popup.json'),
    sidebar: require('../../map-service/src/locales/ko-KR/sidebar.json'),
    settings: require('../../map-service/src/locales/ko-KR/settings.json'),
    agreement: require('../../map-service/src/locales/ko-KR/agreement.json'),
  },
  'ru-RU': {
    common: require('../../map-service/src/locales/ru-RU/common.json'),
    error: require('../../map-service/src/locales/ru-RU/error.json'),
    header: require('../../map-service/src/locales/ru-RU/header.json'),
    lang: require('../../map-service/src/locales/ru-RU/lang.json'),
    popup: require('../../map-service/src/locales/ru-RU/popup.json'),
    sidebar: require('../../map-service/src/locales/ru-RU/sidebar.json'),
    settings: require('../../map-service/src/locales/ru-RU/settings.json'),
    agreement: require('../../map-service/src/locales/ru-RU/agreement.json'),
  },
  'es-MX': {
    common: require('../../map-service/src/locales/es-MX/common.json'),
    error: require('../../map-service/src/locales/es-MX/error.json'),
    header: require('../../map-service/src/locales/es-MX/header.json'),
    lang: require('../../map-service/src/locales/es-MX/lang.json'),
    popup: require('../../map-service/src/locales/es-MX/popup.json'),
    sidebar: require('../../map-service/src/locales/es-MX/sidebar.json'),
    settings: require('../../map-service/src/locales/es-MX/settings.json'),
    agreement: require('../../map-service/src/locales/es-MX/agreement.json'),
  },
};

export function nativeResourceLoader(language: string, namespace: string): Promise<Record<string, unknown>> {
  const resource = resources[language]?.[namespace];
  if (resource) {
    return Promise.resolve(resource);
  }
  return Promise.reject(new Error(`Missing locale: ${language}/${namespace}`));
}
