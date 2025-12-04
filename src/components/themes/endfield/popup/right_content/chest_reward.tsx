import type { DealedRewardItem } from '@eftypes/reward';
import type { EntityData } from '@endfieldmap/map-core';
import { Item } from '@themes/endfield/components/item';
import { RewardTitle } from '@themes/endfield/popup/right_content/reward_title';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { hasChestReward, isDealedRewardItemWithCount } from '@/utils/reward';
import { useAdapter } from '@/hooks/use_adapter';

export const ChestReward = ({ entity }: { entity: EntityData }) => {
  const [rewards, setRewards] = useState<DealedRewardItem[]>([]);
  const showRewards = hasChestReward(entity);
  const { t } = useTranslation(['popup', 'item']);
  const { dataService } = useAdapter();

  const getRewadData = useCallback(async () => {
    if (showRewards) {
      const rewards = await dataService.chestRewardDataService.getRewards(entity.properties.reward_id);
      return rewards;
    }
  }, [entity, showRewards]);

  useEffect(() => {
    getRewadData().then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData]);

  if (!showRewards) {
    return null;
  }
  if (!rewards || rewards.length <= 0) {
    return <div className="text-center text-gray-400 py-4">暂无奖励信息</div>;
  }
  return (
    <div>
      <RewardTitle>{t('popup:reward.chest.title')}</RewardTitle>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-2">
        {rewards.map((rwd) => (
          <Item
            key={rwd.id}
            icon={<img src={rwd.icon} alt={t(`item:${rwd.id}.name`)} className="w-full h-full object-contain" />}
            count={isDealedRewardItemWithCount(rwd) ? rwd.count : undefined}
            name={t(`item:${rwd.id}.name`)}
          ></Item>
        ))}
      </div>
    </div>
  );
};
