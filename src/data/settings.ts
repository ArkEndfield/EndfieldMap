import type { Settings } from '@/types/settings';
import { ref } from 'vue';

export const DEFAULT_SETTINGS: Settings = {
  isClusteringEnabled: true,
  showMenuMenu: false,
  sidebarExpanded: true,
  adjustPopupPosition: true,
  showElectricPoleRange: false,
  swiperExpanded: true,
};

const settings = ref<Settings>(DEFAULT_SETTINGS);

export default settings;
