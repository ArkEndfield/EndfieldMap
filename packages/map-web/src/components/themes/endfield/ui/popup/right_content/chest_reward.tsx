import type { EntityData } from '@endfieldmap/map-core';
import { Item } from '@themes/endfield/components/item';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SubPopupTitle } from '@/components/themes/endfield/ui/popup/right_content/title';
import { useAdapter } from '@/hooks/use_adapter';
import type { DealedRewardItem } from '@/services/data/map/chest_reward';
import { isDealedRewardItemWithCount } from '@/utils/reward';

export const ChestReward = ({ entity }: { entity: EntityData }) => {
  const [rewards, setRewards] = useState<DealedRewardItem[]>([]);
  const { t } = useTranslation(['popup', 'lang']);
  const { mapDataService } = useAdapter();

  const getRewadData = useCallback(async () => {
    const rewards = await mapDataService.chestRewardDataService.getRewards(entity.properties.reward_id);
    return rewards;
  }, [mapDataService.chestRewardDataService, entity]);

  useEffect(() => {
    getRewadData().then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData]);

  if (!rewards || rewards.length <= 0) {
    return <div className="text-center text-gray-400 py-4">暂无奖励信息</div>;
  }

  return (
    <div>
      <SubPopupTitle>{t('popup:reward.chest.title')}</SubPopupTitle>
      <div className="grid grid-cols-3 gap-x-4 gap-y-8 pb-8 pl-6 pr-5 pt-3">
        {rewards.map((rwd) => (
          <Item
            key={rwd.id}
            icon={
              <img
                src={rwd.icon}
                alt={t(`lang:${rwd.name}`, {
                  defaultValue: rwd.name,
                })}
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
    </div>
  );
};
