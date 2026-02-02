import type { JSONLoader } from '@endfieldmap/tools';

import type { LevelData, ParsedLevel, PieceData } from '@/@types/delta_robot';
import type { DeltaRobotParsedLevelSchemaType } from '@/services/data/db/schema/game_data/delta_robot';
import { DataService } from '@/services/data/index';
import { parseLevelData } from '@/services/delta_robot/loader';
import { getAssetUrls } from '@/utils/url';

const assetURL = getAssetUrls();

export class DeltaRobotDataService {
  private jsonLoader: JSONLoader;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
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
