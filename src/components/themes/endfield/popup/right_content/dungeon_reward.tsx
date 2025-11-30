import type { DealedRewardItem } from '@eftypes/reward';
import type { EntityData } from '@endfieldmap/map-core';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { dataService } from '@/services/data';
import { hasDungeonReward, isDealedRewardItemWithCount } from '@/utils/reward';

import { Item } from '../../components/item';
import { RewardTitle } from './reward_title';

export const DungeonReward = ({ entity }: { entity: EntityData }) => {
  const [rewards, setRewards] = useState<Record<string, DealedRewardItem[]>>({});
  const showRewards = hasDungeonReward(entity);

  const getRewadData = useCallback(async () => {
    if (showRewards) {
      const rewards = await dataService.dungeonSeriesDataService.getDungeonRewards(
        entity.properties.dungeion_series_id
      );
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
  if (!rewards || Object.keys(rewards).length <= 0) {
    return <div className="text-center text-gray-400 py-4">暂无奖励信息</div>;
  }
  return (
    <div className="last:mb-0">
      {Object.entries(rewards).map(([key, rwds]) => (
        <Fragment key={key}>
          <RewardTitle>{key}</RewardTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-2 mb-8">
            {rwds.map((rwd) => (
              <Item
                key={rwd.id}
                icon={
                  <img
                    src={rwd.icon}
                    // alt="t(`item.${rwd.id}.name`)"
                    className="w-full h-full object-contain"
                  />
                }
                count={isDealedRewardItemWithCount(rwd) ? rwd.count : undefined}
                name="item.${rwd.id}.name"
              ></Item>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
};
