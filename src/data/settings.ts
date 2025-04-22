import type { Settings, SettingsChangeCallback } from '@/types/settings';
import { ref } from 'vue';

export const DEFAULT_SETTINGS: Settings = {
  isClusteringEnabled: true,
  showMenuMenu: false,
  sidebarExpanded: true,
  adjustPopupPosition: true,
};

export const settingsChangeCallbacks: SettingsChangeCallback[] = [];

const settings = ref<Settings>(DEFAULT_SETTINGS);

export default settings;
