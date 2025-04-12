export const DATA_DB_KEY = {
  MARKS: 'endfield-map-marks',
} as const;

export const CACHE_DB_KEY = {
  POINTS: 'allPoints',
  CURRENT_POINTS: 'currentPoints',
  REWARDS: 'allRewards',
  REWARDS_DATA: 'allRewardData',
  GUIDES: 'allGuides',
  CHARACTER: 'character',
  CHARACTER_ENTITY: 'characterEntity',
  WEAPON: 'weapon',
  WEAPON_ENTITY: 'weaponEntity',
} as const;

export const LOCAL_STORAGE_KEY = {
  MAP: 'map',
  ZOOM: 'zoom',
  LANGUAGE: 'userLanguage',
} as const;
