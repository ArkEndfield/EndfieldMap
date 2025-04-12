import { CACHE_DB_KEY } from '@/constants/db_key';
import type { MaterialData } from '@/types/material';
import { getItem, StorageType, setItem } from '@/utils/indexedDBStorage';
import { loadJSON } from '@/utils/jsonLoader';

const DBCharEntityKey = CACHE_DB_KEY.CHARACTER_ENTITY;
const DBWeaponEntityKey = CACHE_DB_KEY.WEAPON_ENTITY;

export async function getAllCharMaterialData(): Promise<MaterialData> {
  const charEntityData = await getItem<MaterialData>(
    DBCharEntityKey,
    StorageType.PERMANENT
  );
  return charEntityData || {};
}

export const getCharMaterial = async (id: string) => {
  const charEntityData = await getAllCharMaterialData();
  if (charEntityData[id]) {
    return charEntityData[id];
  } else {
    console.warn(`没有找到ID为 ${id} 的角色实体数据`);
    return null;
  }
};

export const getAllMaterialCharIDs = async () => {
  const charEntityData = await getAllCharMaterialData();
  const charIDs = Object.keys(charEntityData);
  return charIDs;
};

export async function getAllWeaponMaterialData(): Promise<MaterialData> {
  const weaponData = await getItem<MaterialData>(
    DBWeaponEntityKey,
    StorageType.PERMANENT
  );
  return weaponData || {};
}
export const getWeaponMaterial = async (id: string) => {
  const weaponData = await getAllWeaponMaterialData();
  if (weaponData[id]) {
    return weaponData[id];
  } else {
    console.warn(`没有找到ID为 ${id} 的武器实体数据`);
    return null;
  }
};
export const getAllMaterialWeaponIDs = async () => {
  const weaponData = await getAllWeaponMaterialData();
  const weaponIDs = Object.keys(weaponData);
  return weaponIDs;
};

export async function loadMaterialData() {
  try {
    const charEntityData = await loadJSON<MaterialData>(
      '/data/char_entity.json'
    );
    const weaponData = await loadJSON<MaterialData>('/data/weapon_entity.json');

    // 存储到 IndexedDB
    await setItem(DBCharEntityKey, charEntityData, StorageType.PERMANENT);

    await setItem(DBWeaponEntityKey, weaponData, StorageType.PERMANENT);

    console.log(
      '角色实体列表加载完成，总数:',
      Object.keys(charEntityData).length
    );
    console.log('武器实体列表加载完成，总数:', Object.keys(weaponData).length);

    return { charEntityData, weaponData };
  } catch (error) {
    console.error('实体列表加载失败:', error);
    throw error;
  }
}
