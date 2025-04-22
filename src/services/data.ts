import { BackupData } from '@/types/data';
import { coverMarks, getMarks, isMarkDataValid, mergeMarks } from './marks';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import { Language, setLanguage } from '@/i18n';
import { selectMap } from './MapCore';
import settings from '@/data/settings';
import { mergeSettings } from './settings';
import {
  getBackupData,
  restoreBackupData,
  restoreBackupDataReplace,
  restorePointsMerge,
  restorePointsReplace,
} from './customPoints';
import { useI18n } from 'vue-i18n';
import { entityShowStates } from '@/data/entity';

// 检查数据格式是否合法
export const isBackupDataValid = (data: BackupData) => {
  if (!data) return false;
  if (!data.version) return false;
  if (!data.db || !data.storage) return false;
  if (!isMarkDataValid(data.db.marks)) return false;
  return true;
};

// 覆盖恢复数据
export const coverData = async (data: BackupData | null) => {
  // 设置标点
  if (isMarkDataValid(data?.db?.marks)) {
    await coverMarks(data.db.marks);
  }
  // 设置地图
  if (data?.storage?.map) {
    selectMap(data.storage.map);
  }
  // 设置语言
  if (data?.storage?.userLanguage) {
    setLanguage(data.storage.userLanguage);
    const { t } = useI18n();
    document.title = t('title') || '终末地地图资源查询';
  }
  // 设置设置
  if (data?.db?.settings) {
    mergeSettings(data.db.settings);
  }
  // 设置自定义点
  if (data?.db?.customPoints && data?.db?.customPointsData) {
    restoreBackupDataReplace({
      customPoints: data.db.customPoints,
      customPointsData: data.db.customPointsData,
    });
  } else if (data?.db?.customPoints) {
    restorePointsReplace(data.db.customPoints);
  }
  // 设置实体显示状态
  if (data?.db?.entityShowStates) {
    Object.keys(data.db.entityShowStates).forEach(key => {
      entityShowStates[key] = data.db.entityShowStates[key];
    });
  }
};

// 合并恢复数据
export const mergeData = async (data: BackupData | null) => {
  // 设置标点
  if (isMarkDataValid(data?.db?.marks)) {
    await mergeMarks(data.db.marks);
  }
  // 设置地图
  if (data?.storage?.map) {
    selectMap(data.storage.map);
  }
  // 设置语言
  if (data?.storage?.userLanguage) {
    setLanguage(data.storage.userLanguage);
    const { t } = useI18n();
    document.title = t('title') || '终末地地图资源查询';
  }
  // 设置设置
  if (data?.db?.settings) {
    mergeSettings(data.db.settings);
  }
  // 设置自定义标点
  if (data?.db?.customPoints && data?.db?.customPointsData) {
    restoreBackupData({
      customPoints: data.db.customPoints,
      customPointsData: data.db.customPointsData,
    });
  } else if (data?.db?.customPoints) {
    restorePointsMerge(data.db.customPoints);
  }
  // 设置实体显示状态
  if (data?.db?.entityShowStates) {
    Object.keys(data.db.entityShowStates).forEach(key => {
      entityShowStates[key] = data.db.entityShowStates[key];
    });
  }
};

// 备份数据
export const backupData = async () => {
  const { customPoints, customPointsData } = await getBackupData();
  const data: BackupData = {
    version: '0.0.3',
    db: {
      marks: getMarks(),
      settings: settings.value,
      customPoints,
      customPointsData,
      entityShowStates: { ...entityShowStates },
    },
    storage: {
      [LOCAL_STORAGE_KEY.MAP]:
        localStorage.getItem(LOCAL_STORAGE_KEY.MAP) || '',
      [LOCAL_STORAGE_KEY.LANGUAGE]:
        (localStorage.getItem(LOCAL_STORAGE_KEY.LANGUAGE) as Language) || null,
    },
  };
  return data;
};
