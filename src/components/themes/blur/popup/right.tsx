import { ChestReward } from '@themes/endfield/popup/right_content/chest_reward';
import { DungeonReward } from '@themes/endfield/popup/right_content/dungeon_reward';

import { useAdapter } from '@/hooks/use_adapter';
import { hasReward } from '@/utils/reward';

// 奖励内容
export const RightContent = () => {
  const { adapter } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;
  const showRewards = hasReward(entity);

  if (!entity || !showRewards) {
    return null;
  }

  return (
    <>
      <ChestReward entity={entity} />
      <DungeonReward entity={entity} />
    </>
  );
};
