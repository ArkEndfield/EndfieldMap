export interface DungeonSeriesData {
  id: string;
  includeDungeon: {
    dungeonId: string;
    levelId: string;
    enemyIds: string[];
    enemyLevels: number[];
    recommendLv: number;
    costStamina: number;
    difficulty: number;
    extraRewardId: string;
    firstPassRewardId: string;
    gameCoolDown: number;
    rewardId: string;
  }[];
}
