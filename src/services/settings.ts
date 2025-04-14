import { DATA_DB_KEY } from '@/constants/db_key';
import settings, { DEFAULT_SETTINGS } from '@/data/settings';
import { Settings } from '@/types/settings';
import { debounce } from '@/utils/common';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { watchEffect } from 'vue';
import { recalculateCluster } from './MapCore';

const DB_KEY = DATA_DB_KEY.SETTINGS;

export const initializeSettings = async () => {
  const settingsDbData = await getItem<Settings>(DB_KEY);
  if (!settingsDbData) {
    await setItem(DB_KEY, DEFAULT_SETTINGS);
  } else {
    settings.value = settingsDbData;
  }
  watchEffect(() => {
    recalculateCluster();
    const plainSettings = { ...settings.value };
    syncSettings(plainSettings);
  });
  return settings.value;
};

export const resetSettings = () => {
  settings.value = DEFAULT_SETTINGS;
};

const syncSettings = debounce(async (newVal: Settings) => {
  const plainSettings = { ...newVal };
  await setItem(DB_KEY, plainSettings);
}, 500);
