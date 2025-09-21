export interface Settings {
  isClusteringEnabled: boolean;
  sidebarExpanded: boolean;
  showMenuMenu: boolean;
  adjustPopupPosition: boolean;
  showElectricPoleRange: boolean;
}

export type SettingsChangeCallback = (settings: Settings) => void;
