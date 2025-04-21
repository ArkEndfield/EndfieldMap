import { DATA_DB_KEY } from '@/constants/db_key';
import settings, {
  DEFAULT_SETTINGS,
  settingsChangeCallbacks,
} from '@/data/settings';
import type { Settings, SettingsChangeCallback } from '@/types/settings';
import { debounce } from '@/utils/common';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { watchEffect } from 'vue';

const DB_KEY = DATA_DB_KEY.SETTINGS;

export const initializeSettings = async () => {
  const settingsDbData = await getItem<Settings>(DB_KEY);
  if (!settingsDbData) {
    await setItem(DB_KEY, DEFAULT_SETTINGS);
  } else {
    mergeSettings(settingsDbData);
  }
  watchEffect(() => {
    const plainSettings = { ...settings.value };
    syncSettings(plainSettings);
    notifySettingsChange();
  });
  return settings.value;
};

export const resetSettings = () => {
  settings.value = DEFAULT_SETTINGS;
};

export const mergeSettings = (newVal: Settings) => {
  settings.value = { ...settings.value, ...newVal };
};

const syncSettings = debounce(async (newVal: Settings) => {
  const plainSettings = { ...newVal };
  await setItem(DB_KEY, plainSettings);
}, 500);

export const onSettingsChange = (callback: SettingsChangeCallback) => {
  settingsChangeCallbacks.push(callback);
};

export const offSettingsChange = (callback: SettingsChangeCallback) => {
  const index = settingsChangeCallbacks.indexOf(callback);
  if (index !== -1) {
    settingsChangeCallbacks.splice(index, 1);
  }
};

export const notifySettingsChange = () => {
  settingsChangeCallbacks.forEach(callback => {
    try {
      callback(settings.value);
    } catch (error) {
      console.error('Settings change callback error:', error);
    }
  });
};
