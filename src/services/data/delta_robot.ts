import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import type { LevelData, ParsedLevel, PieceData } from '@/@types/delta_robot';
import { parseLevelData } from '@/services/delta_robot/loader';
import { getAssetUrls } from '@/utils/url';

const assetURL = getAssetUrls();

export class DeltaRobotDataService {
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  @observable accessor levelList: Record<string, string[]> = {};

  constructor(jsonLoader: JSONLoader, storage: StorageManager) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
  }

  @action
  public async init() {
    const levelListUrl = `${assetURL.miniGameData}/minigame.json`;
    const levelList = await this.jsonLoader.loadJSON<Record<string, string[]>>(levelListUrl);
    this.levelList = levelList;
  }

  /**
   * 获取关卡列表
   */
  public getLevelList(id: string | number) {
    return this.levelList[id.toString()];
  }

  /**
   * 获取关卡数据
   * @param levelId 关卡ID
   */
  public async getLevelData(levelId: string): Promise<ParsedLevel | null> {
    const cached = (await this.storage.permanentGet<Record<string, ParsedLevel>>(StorageKey.DELTA_ROBOT_LEVEL)) || {};

    if (cached[levelId]) {
      return cached[levelId];
    }

    try {
      // 加载关卡数据
      const levelUrl = `${assetURL.miniGameData}/delta_robot/${levelId}.json`;
      const levelData = await this.jsonLoader.loadJSON<LevelData>(levelUrl);

      // 拼图块加载器
      const pieceLoader = async (blockId: string) => {
        const pieceUrl = `${assetURL.miniGameData}/delta_robot/${blockId}.json`;
        return this.jsonLoader.loadJSON<PieceData>(pieceUrl);
      };

      // 解析关卡数据
      const parsed = await parseLevelData(levelData, pieceLoader);

      cached[levelId] = parsed;
      this.storage.permanentSet(StorageKey.DELTA_ROBOT_LEVEL, cached);

      return parsed;
    } catch (error) {
      console.error(`Failed to load level ${levelId}:`, error);
      return null;
    }
  }
}
