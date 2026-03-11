import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { SETTINGS_KEYS, SETTINGS_PAGE } from '@/const/settings';

const containsValue = (obj: unknown, value: string): boolean => {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const v of Object.values(obj)) {
    if (v === value) return true;
    if (typeof v === 'object' && containsValue(v, value)) return true;
  }
  return false;
};

const findPageForKey = (itemKey: string) => {
  for (const [page, items] of Object.entries(SETTINGS_KEYS)) {
    if (containsValue(items, itemKey)) {
      return SETTINGS_PAGE[page as keyof typeof SETTINGS_PAGE];
    }
  }
  return null;
};

export const useSettingNavigate = () => {
  const router = useRouter();

  const navigate = useCallback(
    (key: string) => {
      const pageKeys = Object.values(SETTINGS_PAGE) as string[];

      if (pageKeys.includes(key)) {
        router.push({ pathname: '/settings', params: { tab: key } });
        return;
      }

      const page = findPageForKey(key);
      if (page) {
        router.push({ pathname: '/settings', params: { tab: page, item: key } });
      } else {
        router.push({ pathname: '/settings', params: { tab: SETTINGS_PAGE.GENERAL } });
      }
    },
    [router],
  );

  return { navigate };
};
