import type { DealedRewardItem } from '@endfieldmap/map-service';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { service } from '@/services/map-service';

import { RewardItem } from './reward-item';
import { SubPopupTitle } from './sub-popup-title';
import type { DungeonEntryComponentData } from './types';

function isDealedRewardItemWithCount(
  item: DealedRewardItem,
): item is DealedRewardItem & { type: 'withCount'; count: number } {
  return item.type === 'withCount';
}

interface DungeonEntryComponentProps {
  prop: DungeonEntryComponentData;
}

export function DungeonEntryComponent({ prop }: DungeonEntryComponentProps) {
  const { system_inst_key } = prop;
  const [rewards, setRewards] = useState<Record<string, DealedRewardItem[]>>({});
  const { t } = useTranslation('lang');

  const fetchRewards = useCallback(
    async (id: string) => {
      const data = await service.dataService.dungeonSeriesDataService.getDungeonRewards(id);
      return data;
    },
    [],
  );

  useEffect(() => {
    fetchRewards(system_inst_key).then((data) => {
      if (data) setRewards(data);
    });
  }, [fetchRewards, system_inst_key]);

  if (!rewards || Object.keys(rewards).length <= 0) {
    return (
      <View className="py-4">
        <Text className="text-center text-sm text-text-muted">暂无奖励信息</Text>
      </View>
    );
  }

  return (
    <View>
      {Object.entries(rewards).map(([key, rwds]) => (
        <Fragment key={key}>
          <SubPopupTitle>{key}</SubPopupTitle>
          <View className="flex-row flex-wrap gap-4 px-4 py-3">
            {rwds.map((rwd) => (
              <RewardItem
                key={rwd.id}
                icon={rwd.icon}
                count={isDealedRewardItemWithCount(rwd) ? rwd.count : undefined}
                name={t(`lang:${rwd.name}`, { defaultValue: rwd.name })}
              />
            ))}
          </View>
        </Fragment>
      ))}
    </View>
  );
}
