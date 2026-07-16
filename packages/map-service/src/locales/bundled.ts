// 完整语言 (7 UI namespaces)
// 部分语言 (仅 common)
// 注意：`lang` 命名空间不再打包，运行时按 locale 从 CDN 外部加载
// （见 MapService 中的 resourceLoader 与 AssetService.url.langI18n）。
import deDECommon from './de-DE/common.json';
import enUSAgreement from './en-US/agreement.json';
import enUSCommon from './en-US/common.json';
import enUSError from './en-US/error.json';
import enUSHeader from './en-US/header.json';
import enUSPopup from './en-US/popup.json';
import enUSSettings from './en-US/settings.json';
import enUSSidebar from './en-US/sidebar.json';
import esMXAgreement from './es-MX/agreement.json';
import esMXCommon from './es-MX/common.json';
import esMXError from './es-MX/error.json';
import esMXHeader from './es-MX/header.json';
import esMXPopup from './es-MX/popup.json';
import esMXSettings from './es-MX/settings.json';
import esMXSidebar from './es-MX/sidebar.json';
import frFRCommon from './fr-FR/common.json';
import idIDCommon from './id-ID/common.json';
import itITCommon from './it-IT/common.json';
import jaJPAgreement from './ja-JP/agreement.json';
import jaJPCommon from './ja-JP/common.json';
import jaJPError from './ja-JP/error.json';
import jaJPHeader from './ja-JP/header.json';
import jaJPPopup from './ja-JP/popup.json';
import jaJPSettings from './ja-JP/settings.json';
import jaJPSidebar from './ja-JP/sidebar.json';
import koKRAgreement from './ko-KR/agreement.json';
import koKRCommon from './ko-KR/common.json';
import koKRError from './ko-KR/error.json';
import koKRHeader from './ko-KR/header.json';
import koKRPopup from './ko-KR/popup.json';
import koKRSettings from './ko-KR/settings.json';
import koKRSidebar from './ko-KR/sidebar.json';
import ptBRCommon from './pt-BR/common.json';
import ruRUAgreement from './ru-RU/agreement.json';
import ruRUCommon from './ru-RU/common.json';
import ruRUError from './ru-RU/error.json';
import ruRUHeader from './ru-RU/header.json';
import ruRUPopup from './ru-RU/popup.json';
import ruRUSettings from './ru-RU/settings.json';
import ruRUSidebar from './ru-RU/sidebar.json';
import thTHCommon from './th-TH/common.json';
import viVNCommon from './vi-VN/common.json';
import zhCNAgreement from './zh-CN/agreement.json';
import zhCNCommon from './zh-CN/common.json';
import zhCNError from './zh-CN/error.json';
import zhCNHeader from './zh-CN/header.json';
import zhCNPopup from './zh-CN/popup.json';
import zhCNSettings from './zh-CN/settings.json';
import zhCNSidebar from './zh-CN/sidebar.json';
import zhTWAgreement from './zh-TW/agreement.json';
import zhTWCommon from './zh-TW/common.json';
import zhTWError from './zh-TW/error.json';
import zhTWHeader from './zh-TW/header.json';
import zhTWPopup from './zh-TW/popup.json';
import zhTWSettings from './zh-TW/settings.json';
import zhTWSidebar from './zh-TW/sidebar.json';

/**
 * 所有 locale 资源的静态映射（不含 `lang` 命名空间）
 */
export const bundledResources: Record<string, Record<string, Record<string, unknown>>> = {
  'zh-CN': {
    common: zhCNCommon,
    error: zhCNError,
    header: zhCNHeader,
    popup: zhCNPopup,
    sidebar: zhCNSidebar,
    settings: zhCNSettings,
    agreement: zhCNAgreement,
  },
  'zh-TW': {
    common: zhTWCommon,
    error: zhTWError,
    header: zhTWHeader,
    popup: zhTWPopup,
    sidebar: zhTWSidebar,
    settings: zhTWSettings,
    agreement: zhTWAgreement,
  },
  'en-US': {
    common: enUSCommon,
    error: enUSError,
    header: enUSHeader,
    popup: enUSPopup,
    sidebar: enUSSidebar,
    settings: enUSSettings,
    agreement: enUSAgreement,
  },
  'ja-JP': {
    common: jaJPCommon,
    error: jaJPError,
    header: jaJPHeader,
    popup: jaJPPopup,
    sidebar: jaJPSidebar,
    settings: jaJPSettings,
    agreement: jaJPAgreement,
  },
  'ko-KR': {
    common: koKRCommon,
    error: koKRError,
    header: koKRHeader,
    popup: koKRPopup,
    sidebar: koKRSidebar,
    settings: koKRSettings,
    agreement: koKRAgreement,
  },
  'ru-RU': {
    common: ruRUCommon,
    error: ruRUError,
    header: ruRUHeader,
    popup: ruRUPopup,
    sidebar: ruRUSidebar,
    settings: ruRUSettings,
    agreement: ruRUAgreement,
  },
  'es-MX': {
    common: esMXCommon,
    error: esMXError,
    header: esMXHeader,
    popup: esMXPopup,
    sidebar: esMXSidebar,
    settings: esMXSettings,
    agreement: esMXAgreement,
  },
  'de-DE': { common: deDECommon },
  'fr-FR': { common: frFRCommon },
  'id-ID': { common: idIDCommon },
  'it-IT': { common: itITCommon },
  'pt-BR': { common: ptBRCommon },
  'th-TH': { common: thTHCommon },
  'vi-VN': { common: viVNCommon },
};

/**
 * 静态资源加载器，签名兼容 I18nServiceConfig.resourceLoader
 * 用于不支持动态 import 的环境（如 React Native / Metro）
 *
 * 注意：`lang` 命名空间不在此加载——它由 MapService 统一拦截并从 CDN 拉取。
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
