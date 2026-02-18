import { Item } from '@themes/endfield/components/item';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SubPopupTitle } from '@/components/common/popup/components/title';
import type { DungeonEntryComponent } from '@/components/common/popup/sub/components/types';
import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';
import { useAdapter } from '@/hooks/use_adapter';
import type { DealedRewardItem } from '@/services/data/map/chest_reward';
import { isDealedRewardItemWithCount } from '@/utils/reward';

const DungeonEntryComponent: SubPopupComponentProps<DungeonEntryComponent> = ({ prop }) => {
  const { system_inst_key } = prop;
  const [rewards, setRewards] = useState<Record<string, DealedRewardItem[]>>({});
  const { mapDataService } = useAdapter();
  const { t } = useTranslation('lang');

  const getRewadData = useCallback(
    async (id: string) => {
      const rewards = await mapDataService.dungeonSeriesDataService.getDungeonRewards(id);
      return rewards;
    },
    [mapDataService.dungeonSeriesDataService]
  );

  useEffect(() => {
    getRewadData(system_inst_key).then((data) => {
      if (data) {
        setRewards(data);
      }
    });
  }, [getRewadData, system_inst_key]);

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

export default DungeonEntryComponent;
