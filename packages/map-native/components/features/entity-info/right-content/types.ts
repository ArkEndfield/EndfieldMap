import type React from 'react';

export interface SubPopupComponentPropsWrapper<T> {
  prop: T;
}

export type SubPopupComponentProps<T> = React.FC<SubPopupComponentPropsWrapper<T>>;

export interface InteractiveLockComponentData {
  lockData: LockData[];
}

export interface DungeonEntryComponentData {
  system_inst_key: string;
}

export interface TreasureComponentData {
  reward_id: string;
}

export interface MiniGameLockData {
  unlockType: 'MiniGame';
  miniGameIds: string[];
}

export type LockData = MiniGameLockData;
