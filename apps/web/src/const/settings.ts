export const SETTINGS_PAGE = {
  GENERAL: 'general',
  DISPLAY: 'display',
  AI: 'ai',
  DATA: 'data',
  ABOUT: 'about',
} as const;

export const SETTINGS_KEYS = {
  GENERAL: {
    CLUSTER: 'general.cluster',
    CENTER_VIEW: 'general.center_view',
    ADJUST_VIEW: 'general.adjust_view',
    HOVER: 'general.hover',
    WASD: 'general.wasd',
    PLAYER_POSITION: 'general.player_position',
    PLAYER_TIER: 'general.player_tier',
  },
  DISPLAY: {
    THEME: 'display.theme',
    DARK_MODE: 'display.dark_mode',
    LANGUAGE: 'display.language',
    AUDIO: 'display.audio',
    POPUP: 'display.popup',
  },
  AI: {
    ENABLED: 'ai.enabled',
    PROVIDER: 'ai.provider',
    MODEL: 'ai.model',
    TEMPERATURE: 'ai.temperature',
  },
  DATA: {
    ENTITY: 'data.entity',
    CACHE: 'data.cache',
    STATE: 'data.state',
    ALL: 'data.all',
    COPY_SENTRY_IDS: 'data.copy_sentry_ids',
  },
  ABOUT: {
    INFO: 'about.info',
    LINKS: 'about.links',
  },
} as const;

export type SettingsPageType = (typeof SETTINGS_PAGE)[keyof typeof SETTINGS_PAGE];
export type SettingsKeyType = string;
