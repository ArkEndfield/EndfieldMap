// 完整语言 (8 namespaces)
// 部分语言 (仅 lang namespace)
import deDECommon from './de-DE/common.json';
import deDELang from './de-DE/lang.json';
import enUSAgreement from './en-US/agreement.json';
import enUSCommon from './en-US/common.json';
import enUSError from './en-US/error.json';
import enUSHeader from './en-US/header.json';
import enUSLang from './en-US/lang.json';
import enUSPopup from './en-US/popup.json';
import enUSSettings from './en-US/settings.json';
import enUSSidebar from './en-US/sidebar.json';
import esMXAgreement from './es-MX/agreement.json';
import esMXCommon from './es-MX/common.json';
import esMXError from './es-MX/error.json';
import esMXHeader from './es-MX/header.json';
import esMXLang from './es-MX/lang.json';
import esMXPopup from './es-MX/popup.json';
import esMXSettings from './es-MX/settings.json';
import esMXSidebar from './es-MX/sidebar.json';
import frFRCommon from './fr-FR/common.json';
import frFRLang from './fr-FR/lang.json';
import idIDCommon from './id-ID/common.json';
import idIDLang from './id-ID/lang.json';
import itITCommon from './it-IT/common.json';
import itITLang from './it-IT/lang.json';
import jaJPAgreement from './ja-JP/agreement.json';
import jaJPCommon from './ja-JP/common.json';
import jaJPError from './ja-JP/error.json';
import jaJPHeader from './ja-JP/header.json';
import jaJPLang from './ja-JP/lang.json';
import jaJPPopup from './ja-JP/popup.json';
import jaJPSettings from './ja-JP/settings.json';
import jaJPSidebar from './ja-JP/sidebar.json';
import koKRAgreement from './ko-KR/agreement.json';
import koKRCommon from './ko-KR/common.json';
import koKRError from './ko-KR/error.json';
import koKRHeader from './ko-KR/header.json';
import koKRLang from './ko-KR/lang.json';
import koKRPopup from './ko-KR/popup.json';
import koKRSettings from './ko-KR/settings.json';
import koKRSidebar from './ko-KR/sidebar.json';
import ptBRCommon from './pt-BR/common.json';
import ptBRLang from './pt-BR/lang.json';
import ruRUAgreement from './ru-RU/agreement.json';
import ruRUCommon from './ru-RU/common.json';
import ruRUError from './ru-RU/error.json';
import ruRUHeader from './ru-RU/header.json';
import ruRULang from './ru-RU/lang.json';
import ruRUPopup from './ru-RU/popup.json';
import ruRUSettings from './ru-RU/settings.json';
import ruRUSidebar from './ru-RU/sidebar.json';
import thTHCommon from './th-TH/common.json';
import thTHLang from './th-TH/lang.json';
import viVNCommon from './vi-VN/common.json';
import viVNLang from './vi-VN/lang.json';
import zhCNAgreement from './zh-CN/agreement.json';
import zhCNCommon from './zh-CN/common.json';
import zhCNError from './zh-CN/error.json';
import zhCNHeader from './zh-CN/header.json';
import zhCNLang from './zh-CN/lang.json';
import zhCNPopup from './zh-CN/popup.json';
import zhCNSettings from './zh-CN/settings.json';
import zhCNSidebar from './zh-CN/sidebar.json';
import zhTWAgreement from './zh-TW/agreement.json';
import zhTWCommon from './zh-TW/common.json';
import zhTWError from './zh-TW/error.json';
import zhTWHeader from './zh-TW/header.json';
import zhTWLang from './zh-TW/lang.json';
import zhTWPopup from './zh-TW/popup.json';
import zhTWSettings from './zh-TW/settings.json';
import zhTWSidebar from './zh-TW/sidebar.json';

/**
 * 所有 locale 资源的静态映射
 */
export const bundledResources: Record<string, Record<string, Record<string, unknown>>> = {
  'zh-CN': {
    common: zhCNCommon,
    error: zhCNError,
    header: zhCNHeader,
    lang: zhCNLang,
    popup: zhCNPopup,
    sidebar: zhCNSidebar,
    settings: zhCNSettings,
    agreement: zhCNAgreement,
  },
  'zh-TW': {
    common: zhTWCommon,
    error: zhTWError,
    header: zhTWHeader,
    lang: zhTWLang,
    popup: zhTWPopup,
    sidebar: zhTWSidebar,
    settings: zhTWSettings,
    agreement: zhTWAgreement,
  },
  'en-US': {
    common: enUSCommon,
    error: enUSError,
    header: enUSHeader,
    lang: enUSLang,
    popup: enUSPopup,
    sidebar: enUSSidebar,
    settings: enUSSettings,
    agreement: enUSAgreement,
  },
  'ja-JP': {
    common: jaJPCommon,
    error: jaJPError,
    header: jaJPHeader,
    lang: jaJPLang,
    popup: jaJPPopup,
    sidebar: jaJPSidebar,
    settings: jaJPSettings,
    agreement: jaJPAgreement,
  },
  'ko-KR': {
    common: koKRCommon,
    error: koKRError,
    header: koKRHeader,
    lang: koKRLang,
    popup: koKRPopup,
    sidebar: koKRSidebar,
    settings: koKRSettings,
    agreement: koKRAgreement,
  },
  'ru-RU': {
    common: ruRUCommon,
    error: ruRUError,
    header: ruRUHeader,
    lang: ruRULang,
    popup: ruRUPopup,
    sidebar: ruRUSidebar,
    settings: ruRUSettings,
    agreement: ruRUAgreement,
  },
  'es-MX': {
    common: esMXCommon,
    error: esMXError,
    header: esMXHeader,
    lang: esMXLang,
    popup: esMXPopup,
    sidebar: esMXSidebar,
    settings: esMXSettings,
    agreement: esMXAgreement,
  },
  'de-DE': { lang: deDELang, common: deDECommon },
  'fr-FR': { lang: frFRLang, common: frFRCommon },
  'id-ID': { lang: idIDLang, common: idIDCommon },
  'it-IT': { lang: itITLang, common: itITCommon },
  'pt-BR': { lang: ptBRLang, common: ptBRCommon },
  'th-TH': { lang: thTHLang, common: thTHCommon },
  'vi-VN': { lang: viVNLang, common: viVNCommon },
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
