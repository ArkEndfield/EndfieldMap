import { Language } from '@endfieldmap/tools';
import type { FallbackLng } from 'i18next';
import i18n from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

const ns = ['common', 'error', 'header', 'lang', 'popup', 'sidebar', 'settings', 'agreement'] as const;
type NSType = (typeof ns)[number];

export interface I18nServiceConfig {
  hooks?: Parameters<typeof i18n.use>[0][];
  isDev?: boolean;
  afterLoad?: () => void;
  resourceLoader: (
    language: string,
    namespace: string
  ) => Promise<{ default: Record<string, unknown> } | Record<string, unknown>>;
  onLoaded?: (
    ns: readonly NSType[],
    loaded: {
      [language: string]: {
        [namespace: string]: boolean;
      };
    }
  ) => void;
}

export class I18nService {
  public i18n = i18n;
  public ns = ns;
  public fallbackLng: FallbackLng = 'zh-CN';
  public languageList: { code: Language; displayName: string }[] = [
    { code: Language.ZH_CN, displayName: '简体中文' },
    { code: Language.ZH_TW, displayName: '繁体中文' },
    { code: Language.EN_US, displayName: 'English' },
    { code: Language.JA_JP, displayName: '日本語' },
    { code: Language.KO_KR, displayName: '한국어' },
    { code: Language.RU_RU, displayName: 'Русский' },
    { code: Language.ES_MX, displayName: 'Español (México)' },
  ];
  public supportedLngs = this.languageList.map((lang) => lang.code);

  constructor(config: I18nServiceConfig) {
    const hooks = config.hooks || [];
    this.i18n.use(resourcesToBackend(config.resourceLoader));
    for (const hook of hooks) {
      this.i18n.use(hook);
    }
    this.i18n.init(
      {
        load: 'currentOnly',
        supportedLngs: this.supportedLngs,
        fallbackLng: this.fallbackLng,
        ns: this.ns,
        defaultNS: 'common',
        debug: config.isDev,
        returnEmptyString: false,
      },
      () => {
        this.i18n.loadNamespaces(this.ns).then(() => {
          config.afterLoad?.();
        });
      }
    );
    this.i18n.on('loaded', (loaded) => {
      config.onLoaded?.(this.ns, loaded);
    });
  }

  /**
   * 获取语言
   * @param locale 语言列表
   * @returns 语言
   */
  public getLanguage(locale: readonly string[]): Language {
    return (locale.find((locale) => this.languageList.some((item) => item.code === locale)) ||
      Language.ZH_CN) as Language;
  }

  /**
   * 获取当前语言
   */
  public get currentLocale() {
    return this.getLanguage(this.i18n.languages || []);
  }

  /**
   * 翻译
   */
  public get translate() {
    return this.i18n.t;
  }
}
