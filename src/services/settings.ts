import { DATA_DB_KEY } from '@/constants/db_key';
import settings, { DEFAULT_SETTINGS } from '@/data/settings';
import type { Settings } from '@/types/settings';
import { debounce } from '@/utils/common';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { watchEffect } from 'vue';
import { pubsub, EVENTS } from '@/services/pubsub';

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

// 通知设置变更
export const notifySettingsChange = () => {
  pubsub.publish(EVENTS.SETTINGS_CHANGE, settings.value);
};
