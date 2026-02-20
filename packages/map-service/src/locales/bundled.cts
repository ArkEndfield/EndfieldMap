// // 完整语言 (8 namespaces)
// import zhCNCommon from './zh-CN/common.json';
// import zhCNError from './zh-CN/error.json';
// import zhCNHeader from './zh-CN/header.json';
// import zhCNLang from './zh-CN/lang.json';
// import zhCNPopup from './zh-CN/popup.json';
// import zhCNSidebar from './zh-CN/sidebar.json';
// import zhCNSettings from './zh-CN/settings.json';
// import zhCNAgreement from './zh-CN/agreement.json';

// import zhTWCommon from './zh-TW/common.json';
// import zhTWError from './zh-TW/error.json';
// import zhTWHeader from './zh-TW/header.json';
// import zhTWLang from './zh-TW/lang.json';
// import zhTWPopup from './zh-TW/popup.json';
// import zhTWSidebar from './zh-TW/sidebar.json';
// import zhTWSettings from './zh-TW/settings.json';
// import zhTWAgreement from './zh-TW/agreement.json';

// import enUSCommon from './en-US/common.json';
// import enUSError from './en-US/error.json';
// import enUSHeader from './en-US/header.json';
// import enUSLang from './en-US/lang.json';
// import enUSPopup from './en-US/popup.json';
// import enUSSidebar from './en-US/sidebar.json';
// import enUSSettings from './en-US/settings.json';
// import enUSAgreement from './en-US/agreement.json';

// import jaJPCommon from './ja-JP/common.json';
// import jaJPError from './ja-JP/error.json';
// import jaJPHeader from './ja-JP/header.json';
// import jaJPLang from './ja-JP/lang.json';
// import jaJPPopup from './ja-JP/popup.json';
// import jaJPSidebar from './ja-JP/sidebar.json';
// import jaJPSettings from './ja-JP/settings.json';
// import jaJPAgreement from './ja-JP/agreement.json';

// import koKRCommon from './ko-KR/common.json';
// import koKRError from './ko-KR/error.json';
// import koKRHeader from './ko-KR/header.json';
// import koKRLang from './ko-KR/lang.json';
// import koKRPopup from './ko-KR/popup.json';
// import koKRSidebar from './ko-KR/sidebar.json';
// import koKRSettings from './ko-KR/settings.json';
// import koKRAgreement from './ko-KR/agreement.json';

// import ruRUCommon from './ru-RU/common.json';
// import ruRUError from './ru-RU/error.json';
// import ruRUHeader from './ru-RU/header.json';
// import ruRULang from './ru-RU/lang.json';
// import ruRUPopup from './ru-RU/popup.json';
// import ruRUSidebar from './ru-RU/sidebar.json';
// import ruRUSettings from './ru-RU/settings.json';
// import ruRUAgreement from './ru-RU/agreement.json';

// import esMXCommon from './es-MX/common.json';
// import esMXError from './es-MX/error.json';
// import esMXHeader from './es-MX/header.json';
// import esMXLang from './es-MX/lang.json';
// import esMXPopup from './es-MX/popup.json';
// import esMXSidebar from './es-MX/sidebar.json';
// import esMXSettings from './es-MX/settings.json';
// import esMXAgreement from './es-MX/agreement.json';

// // 部分语言 (仅 lang namespace)
// import deDELang from './de-DE/lang.json';
// import frFRLang from './fr-FR/lang.json';
// import idIDLang from './id-ID/lang.json';
// import itITLang from './it-IT/lang.json';
// import ptBRLang from './pt-BR/lang.json';
// import thTHLang from './th-TH/lang.json';
// import viVNLang from './vi-VN/lang.json';

/**
 * 所有 locale 资源的静态映射
 */
export const bundledResources: Record<string, Record<string, Record<string, unknown>>> = {
  'zh-CN': {
    common: require('./zh-CN/common.json'),
    error: require('./zh-CN/error.json'),
    header: require('./zh-CN/header.json'),
    lang: require('./zh-CN/lang.json'),
    popup: require('./zh-CN/popup.json'),
    sidebar: require('./zh-CN/sidebar.json'),
    settings: require('./zh-CN/settings.json'),
    agreement: require('./zh-CN/agreement.json'),
  },
  'zh-TW': {
    common: require('./zh-TW/common.json'),
    error: require('./zh-TW/error.json'),
    header: require('./zh-TW/header.json'),
    lang: require('./zh-TW/lang.json'),
    popup: require('./zh-TW/popup.json'),
    sidebar: require('./zh-TW/sidebar.json'),
    settings: require('./zh-TW/settings.json'),
    agreement: require('./zh-TW/agreement.json'),
  },
  'en-US': {
    common: require('./en-US/common.json'),
    error: require('./en-US/error.json'),
    header: require('./en-US/header.json'),
    lang: require('./en-US/lang.json'),
    popup: require('./en-US/popup.json'),
    sidebar: require('./en-US/sidebar.json'),
    settings: require('./en-US/settings.json'),
    agreement: require('./en-US/agreement.json'),
  },
  'ja-JP': {
    common: require('./ja-JP/common.json'),
    error: require('./ja-JP/error.json'),
    header: require('./ja-JP/header.json'),
    lang: require('./ja-JP/lang.json'),
    popup: require('./ja-JP/popup.json'),
    sidebar: require('./ja-JP/sidebar.json'),
    settings: require('./ja-JP/settings.json'),
    agreement: require('./ja-JP/agreement.json'),
  },
  'ko-KR': {
    common: require('./ko-KR/common.json'),
    error: require('./ko-KR/error.json'),
    header: require('./ko-KR/header.json'),
    lang: require('./ko-KR/lang.json'),
    popup: require('./ko-KR/popup.json'),
    sidebar: require('./ko-KR/sidebar.json'),
    settings: require('./ko-KR/settings.json'),
    agreement: require('./ko-KR/agreement.json'),
  },
  'ru-RU': {
    common: require('./ru-RU/common.json'),
    error: require('./ru-RU/error.json'),
    header: require('./ru-RU/header.json'),
    lang: require('./ru-RU/lang.json'),
    popup: require('./ru-RU/popup.json'),
    sidebar: require('./ru-RU/sidebar.json'),
    settings: require('./ru-RU/settings.json'),
    agreement: require('./ru-RU/agreement.json'),
  },
  'es-MX': {
    common: require('./es-MX/common.json'),
    error: require('./es-MX/error.json'),
    header: require('./es-MX/header.json'),
    lang: require('./es-MX/lang.json'),
    popup: require('./es-MX/popup.json'),
    sidebar: require('./es-MX/sidebar.json'),
    settings: require('./es-MX/settings.json'),
    agreement: require('./es-MX/agreement.json'),
  },
  'de-DE': { lang: require('./de-DE/lang.json') },
  'fr-FR': { lang: require('./fr-FR/lang.json') },
  'id-ID': { lang: require('./id-ID/lang.json') },
  'it-IT': { lang: require('./it-IT/lang.json') },
  'pt-BR': { lang: require('./pt-BR/lang.json') },
  'th-TH': { lang: require('./th-TH/lang.json') },
  'vi-VN': { lang: require('./vi-VN/lang.json') },
};

/**
 * 静态资源加载器，签名兼容 I18nServiceConfig.resourceLoader
 * 用于不支持动态 import 的环境（如 React Native / Metro）
 */
export function bundledResourceLoader(
  language: string,
  namespace: string,
): Promise<Record<string, unknown>> {
  const resource = bundledResources[language]?.[namespace];
  if (resource) {
    return Promise.resolve(resource as Record<string, unknown>);
  }
  return Promise.reject(new Error(`Missing locale: ${language}/${namespace}`));
}
