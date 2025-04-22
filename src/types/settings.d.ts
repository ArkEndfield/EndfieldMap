export interface Settings {
  isClusteringEnabled: boolean;
  sidebarExpanded: boolean;
  showMenuMenu: boolean;
  adjustPopupPosition: boolean;
}

export type SettingsChangeCallback = (settings: Settings) => void;
