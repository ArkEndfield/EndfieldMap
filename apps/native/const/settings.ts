export const SETTINGS_PAGE = {
  GENERAL: 'general',
  DISPLAY: 'display',
  DATA: 'data',
  ABOUT: 'about',
} as const;

export const SETTINGS_KEYS = {
  GENERAL: {
    CLUSTER: 'general.cluster',
  },
  DISPLAY: {
    LANGUAGE: 'display.language',
  },
  DATA: {
    ENTITY: 'data.entity',
    STATE: 'data.state',
    ALL: 'data.all',
  },
  ABOUT: {
    INFO: 'about.info',
    LINKS: 'about.links',
  },
} as const;

export type SettingsPageType = (typeof SETTINGS_PAGE)[keyof typeof SETTINGS_PAGE];
export type SettingsKeyType = string;
