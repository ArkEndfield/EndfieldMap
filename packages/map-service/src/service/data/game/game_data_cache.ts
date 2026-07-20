import { getVersionInfo, LocalStorageDB, logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

/**
 * 游戏静态数据（item / reward / dungeon 等）在 IndexedDB 里的缓存策略。
 *
 * 这些表随构建产物一起发布，同一个版本内容不会变，但此前每次刷新都会
 * 无条件把整张表 bulkUpsert 一遍——上万条记录写 IndexedDB，实测阻塞启动
 * 约 1.7s，且完全挡在地图数据加载之前。
 *
 * 这里改成按版本号门控：版本没变且表里已有数据就直接跳过下载与写入。
 */

const VERSION_KEY_PREFIX = 'game_data_version.';

export interface GameDataLoaderOptions<T> {
  /** 缓存标识，用于存放版本号，需在各表之间唯一 */
  key: string;
  /** 目标 collection；延迟取值，因为数据库要等 DatabaseService 初始化后才存在 */
  collection: () => RxCollection<T>;
  /** 缓存未命中时才会被调用，返回待写入的完整文档列表 */
  load: () => Promise<T[]>;
}

/**
 * 生成一个可重复调用的加载函数：并发/重复调用共用同一个 Promise，
 * 失败则清空记忆，留给下一个读取方重试。
 */
export function createGameDataLoader<T>(options: GameDataLoaderOptions<T>): () => Promise<void> {
  let ready: Promise<void> | null = null;
  return () => {
    ready ??= ensureGameDataCached(options).catch((error: unknown) => {
      ready = null;
      throw error;
    });
    return ready;
  };
}

/**
 * 确保某张游戏静态数据表在本地可用。
 *
 * 命中缓存（版本号一致且表非空）时不发起任何网络与写库操作。
 */
async function ensureGameDataCached<T>({ key, collection, load }: GameDataLoaderOptions<T>): Promise<void> {
  const { commitHash } = getVersionInfo();
  const versionKey = `${VERSION_KEY_PREFIX}${key}`;

  try {
    if (LocalStorageDB.get<string>(versionKey) === commitHash) {
      // 版本一致还要确认表里真的有数据：用户可能单独清了 IndexedDB
      const count = await collection().count().exec();
      if (count > 0) return;
    }
  } catch (error) {
    // 缓存判定失败只影响能否跳过，照常走完整流程即可
    logger.warn(`[GameDataCache] Failed to check cache for ${key}`, error);
  }

  const docs = await load();
  if (docs.length > 0) {
    await collection().bulkUpsert(docs);
  }

  try {
    LocalStorageDB.set(versionKey, commitHash);
  } catch (error) {
    logger.warn(`[GameDataCache] Failed to persist cache version for ${key}`, error);
  }
}
