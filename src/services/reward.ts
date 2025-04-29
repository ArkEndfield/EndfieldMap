import { loadJSON } from '@/utils/jsonLoader';
import { type PointData } from '@/types/points';
import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { CACHE_DB_KEY } from '@/constants/db_key';
import {
  DungeonSeriesData,
  ReturnRewardItem,
  RewardItem,
  RewardItemData,
  RewardItemWithCount,
  RewardType,
} from '@/types/reward';

// IndexedDB 存储键名
const DB_ALL_REWARDS_KEY = CACHE_DB_KEY.REWARDS;
const DB_ALL_REWARD_DATA_KEY = CACHE_DB_KEY.REWARDS_DATA;
const DB_DUNGEON_SERIES_DATA_KEY = CACHE_DB_KEY.DUNGEON_SERIES_DATA;
// 从 IndexedDB 获取所有奖励数据
export async function getAllRewards(): Promise<RewardType> {
  const rewards = await getItem<RewardType>(
    DB_ALL_REWARDS_KEY,
    StorageType.PERMANENT
  );
  if (!rewards) {
    await loadRewardData();
    return await getAllRewards();
  }
  return rewards || {};
}

// 从 IndexedDB 获取所有副本系列数据
export async function getAllDungeonSeriesData(): Promise<
  Record<string, DungeonSeriesData>
> {
  const dungeonSeriesData = await getItem<Record<string, DungeonSeriesData>>(
    DB_DUNGEON_SERIES_DATA_KEY,
    StorageType.PERMANENT
  );
  return dungeonSeriesData || {};
}

// 从 IndexedDB 获取所有奖励物品数据
export async function getAllRewardData(): Promise<
  Record<string, RewardItemData>
> {
  const rewardData = await getItem<Record<string, RewardItemData>>(
    DB_ALL_REWARD_DATA_KEY,
    StorageType.PERMANENT
  );
  return rewardData || {};
}

// 加载奖励数据
export async function loadRewardData() {
  try {
    const rewardRawData = loadJSON<RewardType>('/data/reward.json');
    const dungeonSeriesRaw = loadJSON<Record<string, DungeonSeriesData>>(
      '/data/dungeon_series_data.json'
    );
    const [data, dungeonSeriesData] = await Promise.all([
      rewardRawData,
      dungeonSeriesRaw,
    ]);

    // 存储到 IndexedDB
    await Promise.all([
      setItem(DB_ALL_REWARDS_KEY, data, StorageType.PERMANENT),
      setItem(
        DB_DUNGEON_SERIES_DATA_KEY,
        dungeonSeriesData,
        StorageType.PERMANENT
      ),
    ]);

    console.log('奖励列表加载完成，总数:', Object.keys(data).length);

    return { rewards: data };
  } catch (error) {
    console.error('加载奖励数据失败:', error);
    throw error;
  }
}

export function isRewardWithCountType(
  item: RewardItem
): item is RewardItemWithCount {
  return (item as RewardItemWithCount)?.itemBundles !== undefined;
}

export function isChestReward(point: PointData | null): boolean {
  if (!point) return false;
  return !!point.reward_id;
}

export function isDungeonReward(point: PointData | null): boolean {
  if (!point) return false;
  return !!point.dungeion_series_id;
}

export function shouldShowRewards(point: PointData | null): boolean {
  return isChestReward(point) || isDungeonReward(point);
}

export async function getRewardIcon(
  rewardId: string
): Promise<string | undefined> {
  const allRewardData = await getAllRewardData();
  if (allRewardData[rewardId]?.iconId) {
    const name = allRewardData[rewardId].iconId;
    if (name) return `/item/${name}.png`;
  }
  return undefined;
}

export async function getRewards(
  reward_id?: string
): Promise<ReturnRewardItem[]> {
  if (!reward_id) return [];

  const allRewards = await getAllRewards();
  const rewardItem = allRewards[reward_id];

  if (!rewardItem) return [];

  const rwds: ReturnRewardItem[] = [];

  if (isRewardWithCountType(rewardItem)) {
    for (const itemBundle of rewardItem.itemBundles) {
      const icon = await getRewardIcon(itemBundle.id);
      rwds.push({
        type: 'withCount',
        id: itemBundle.id,
        icon: icon || '',
        count: itemBundle.count,
      });
    }
  } else {
    for (const id of rewardItem.itemIds) {
      const icon = await getRewardIcon(id);
      rwds.push({
        type: 'withoutCount',
        id,
        icon: icon || '',
      });
    }
  }

  return rwds;
}

export async function getDungeonRewards(
  point: PointData | null
): Promise<Record<string, ReturnRewardItem[]>> {
  if (!point || !point.dungeion_series_id) return {};
  const dungeonSeriesData = await getAllDungeonSeriesData();
  const dungeonSeries = dungeonSeriesData[point.dungeion_series_id];
  if (!dungeonSeries) return {};
  const includeDungeon = dungeonSeries.includeDungeon;
  const rewards: Record<string, ReturnRewardItem[]> = {};
  for (const dungeon of includeDungeon) {
    if (!dungeon.rewardId && !dungeon.firstPassRewardId) continue;
    let rewardId = dungeon.rewardId;
    if (!rewardId && dungeon.firstPassRewardId) {
      rewardId = dungeon.firstPassRewardId;
    }
    if (!rewardId) continue;
    const reward = await getRewards(rewardId);
    rewards[dungeon.dungeonId] = reward;
  }
  return rewards;
}

export async function getIncludeDungeonCount(
  point: PointData | null
): Promise<number> {
  if (!point || !point.dungeion_series_id) return 0;
  const dungeonSeriesData = await getAllDungeonSeriesData();
  const dungeonSeries = dungeonSeriesData[point.dungeion_series_id];
  if (!dungeonSeries || !dungeonSeries.includeDungeon) return 0;
  return dungeonSeries.includeDungeon.length;
}
