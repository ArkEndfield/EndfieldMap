import type { JSONLoader } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import type { LevelData, ParsedLevel, PieceData } from '@/@types/delta_robot';
import type { DeltaRobotParsedLevelSchemaType } from '@/services/data/db/schema/game_data/delta_robot';
import { DataService } from '@/services/data/index';
import { parseLevelData } from '@/services/delta_robot/loader';
import { getAssetUrls } from '@/utils/url';

const assetURL = getAssetUrls();

export class DeltaRobotDataService {
  private jsonLoader: JSONLoader;
  @observable accessor levelList: Record<string, string[]> = {};

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  @action
  public async init() {
    // 清空旧数据并加载新数据
    const [_, levelListData] = await Promise.all([
      DataService.dbStorage.database.gameDeltaRobotLevelList.find().remove(),
      this.jsonLoader.loadJSON<Record<string, string[]>>(`${assetURL.miniGameData}/minigame.json`),
    ]);

    // 保存到数据库
    for (const [id, levels] of Object.entries(levelListData || {})) {
      await DataService.dbStorage.database.gameDeltaRobotLevelList.upsert({
        id,
        levels,
      });
    }

    // 同时保持内存中的副本以供快速访问
    this.levelList = levelListData || {};
  }

  /**
   * 获取关卡列表
   */
  public getLevelList(id: string | number) {
    return this.levelList[id.toString()];
  }

  private async getParsedLevelFromDB(levelId: string) {
    return await DataService.dbStorage.database.gameDeltaRobotParsedLevel
      .findOne({
        selector: { levelId },
      })
      .exec();
  }

  /**
   * 获取关卡数据
   * @param levelId 关卡ID
   */
  public async getLevelData(levelId: string): Promise<ParsedLevel | null> {
    // 先从数据库查找缓存
    const cached = await this.getParsedLevelFromDB(levelId);
    if (cached) {
      const data = cached.toJSON();
      return {
        sizeX: data.sizeX,
        sizeY: data.sizeY,
        groups: data.groups as ParsedLevel['groups'],
        rowConstraints: data.rowConstraints as ParsedLevel['rowConstraints'],
        colConstraints: data.colConstraints as ParsedLevel['colConstraints'],
        obstaclesFlat: data.obstaclesFlat as ParsedLevel['obstaclesFlat'],
        pieces: data.pieces as ParsedLevel['pieces'],
      };
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

      // 保存到数据库
      await DataService.dbStorage.database.gameDeltaRobotParsedLevel.upsert({
        levelId,
        ...parsed,
      } as DeltaRobotParsedLevelSchemaType);

      return parsed;
    } catch (error) {
      console.error(`Failed to load level ${levelId}:`, error);
      return null;
    }
  }
}
