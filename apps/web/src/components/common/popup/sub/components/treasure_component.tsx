import type { DealedRewardItem } from '@endfieldmap/map-service';
import { Logo } from '@endfieldmap/web-components';
import { Item } from '@themes/endfield/components/item';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SubPopupTitle } from '@/components/common/popup/components/title';
import type { TreasureComponent } from '@/components/common/popup/sub/components/types';
import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';
import { service } from '@/services';
import { isDealedRewardItemWithCount } from '@/utils/reward';

const TreasureComponent: SubPopupComponentProps<TreasureComponent> = ({ prop }) => {
  const { reward_id } = prop;
  const [rewards, setRewards] = useState<DealedRewardItem[]>([]);
  const { t } = useTranslation(['popup', 'lang']);

  const getRewadData = useCallback(async () => {
    const rewards = await service.dataService.chestRewardDataService.getRewards(reward_id);
    return rewards;
  }, [reward_id]);

  useEffect(() => {
    getRewadData().then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData]);

  if (!rewards || rewards.length <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-4">
        <Logo className="text-3xl" />
        <span className="text-xs">暂无奖励信息</span>
      </div>
    );
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

export default TreasureComponent;
