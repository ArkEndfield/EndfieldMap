import type { DealedRewardItem } from '@eftypes/reward';
import type { EntityData } from '@endfieldmap/map-core';
import { Item } from '@themes/endfield/components/item';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { SubPopupTitle } from '@/components/themes/endfield/ui/popup/right_content/title';
import { useAdapter } from '@/hooks/use_adapter';
import { isDealedRewardItemWithCount } from '@/utils/reward';

export const DungeonReward = ({ entity }: { entity: EntityData }) => {
  const [rewards, setRewards] = useState<Record<string, DealedRewardItem[]>>({});
  const { dataService } = useAdapter();

  const getRewadData = useCallback(async () => {
    const rewards = await dataService.dungeonSeriesDataService.getDungeonRewards(entity.properties.system_inst_key);
    return rewards;
  }, [entity]);

  useEffect(() => {
    getRewadData().then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData]);

  if (!rewards || Object.keys(rewards).length <= 0) {
    return <div className="text-center text-gray-400 py-4">暂无奖励信息</div>;
  }
  return (
    <div className="last:mb-0">
      {Object.entries(rewards).map(([key, rwds]) => (
        <Fragment key={key}>
          <SubPopupTitle>{key}</SubPopupTitle>
          <div className="grid grid-cols-3 gap-x-4 gap-y-8 pb-8 pl-6 pr-4 pt-3">
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
