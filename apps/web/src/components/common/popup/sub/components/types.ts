import type { LockData } from '@/components/common/popup/sub/components/lock_data/types';

export interface InteractiveLockComponent {
  lockData: LockData[];
}

export interface DungeonEntryComponent {
  system_inst_key: string;
}

export interface TreasureComponent {
  reward_id: string;
}

/** 浮空回收小游戏标点（entityDataIdKey = int_system_balloon_big_1）携带的组件数据 */
export interface MinigameBalloonSystemComponent {
  /** 固定为该标点的第一关关卡 id（与 /minigame/balloon/<id>.json 同源） */
  system_inst_key: string;
  reward_id: string;
  /** 多关卡标点的后续关卡 id（第二关起） */
  subMinigameIds?: string[];
}
