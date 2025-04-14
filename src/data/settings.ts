import type { Settings } from '@/types/settings';
import { ref } from 'vue';

export const DEFAULT_SETTINGS: Settings = {
  isClusteringEnabled: true,
  sidebarExpanded: true,
};

const settings = ref<Settings>(DEFAULT_SETTINGS);

export default settings;
