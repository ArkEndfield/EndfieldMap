import { logger } from '@endfieldmap/tools';

import { SETTINGS_KEYS, SETTINGS_PAGE } from '@/const/settings';
import uiManager from '@/services/ui_manager';

const containsValue = (obj: unknown, value: string): boolean => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  for (const v of Object.values(obj)) {
    if (v === value) {
      return true;
    }
    if (typeof v === 'object') {
      if (containsValue(v, value)) {
        return true;
      }
    }
  }
  return false;
};

// 检查是否是设置项
const findPageForKey = (itemKey: string) => {
  for (const [page, items] of Object.entries(SETTINGS_KEYS)) {
    if (containsValue(items, itemKey)) {
      return SETTINGS_PAGE[page as keyof typeof SETTINGS_PAGE];
    }
  }
  return null;
};

export const useSettingNavigate = () => {
  const navigate = (key: string) => {
    // 检查是否是页面
    const pageKeys = Object.values(SETTINGS_PAGE) as string[];
    if (pageKeys.includes(key)) {
      uiManager.navigateSettings(key);
      return;
    }
    const page = findPageForKey(key);
    if (page) {
      uiManager.navigateSettings(page, key);
    } else {
      logger.warn(`Setting key not found: ${key}`);
      // 默认跳转到 general 页面
      uiManager.navigateSettings(SETTINGS_PAGE.GENERAL);
    }
  };

  return { navigate };
};
