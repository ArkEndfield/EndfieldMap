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
