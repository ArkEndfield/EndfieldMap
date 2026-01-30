import type { EntityData } from '@endfieldmap/map-core';
import { Item } from '@themes/endfield/components/item';
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SubPopupTitle } from '@/components/themes/endfield/ui/popup/right_content/title';
import { useAdapter } from '@/hooks/use_adapter';
import type { DealedRewardItem } from '@/services/data/map/chest_reward';
import { isDealedRewardItemWithCount } from '@/utils/reward';

export const DungeonReward = ({ entity }: { entity: EntityData }) => {
  const [rewards, setRewards] = useState<Record<string, DealedRewardItem[]>>({});
  const { mapDataService } = useAdapter();
  const { t } = useTranslation('lang');

  const getRewadData = async (id: EntityData['properties']['system_inst_key']) => {
    const rewards = await mapDataService.dungeonSeriesDataService.getDungeonRewards(id);
    return rewards;
  };

  useEffect(() => {
    getRewadData(entity.properties.system_inst_key).then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData, entity]);

  if (!rewards || Object.keys(rewards).length <= 0) {
    return <div className="text-center text-gray-400 py-4">暂无奖励信息</div>;
  }
  return (
    <div className="last:mb-0">
      {Object.entries(rewards).map(([key, rwds]) => (
        <Fragment key={key}>
          <SubPopupTitle>{key}</SubPopupTitle>
          <div className="grid grid-cols-3 gap-x-4 gap-y-8 pb-8 pl-6 pr-5 pt-3">
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
                name={t(`lang:${rwd.name}`, {
                  defaultValue: rwd.name,
                })}
              />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
};
