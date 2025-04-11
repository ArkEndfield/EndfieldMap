import { BackupData } from '@/types/data';
import { coverMarks, getMarks, isMarkDataValid, mergeMarks } from './marks';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import { Language, setLanguage } from '@/i18n';
import { selectMap } from './MapCore';

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
  }
};

// 备份数据
export const backupData = () => {
  const data: BackupData = {
    version: '0.0.1',
    db: {
      marks: getMarks(),
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
