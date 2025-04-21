export interface Settings {
  isClusteringEnabled: boolean;
  sidebarExpanded: boolean;
  showMenuMenu: boolean;
}

export type SettingsChangeCallback = (settings: Settings) => void;
