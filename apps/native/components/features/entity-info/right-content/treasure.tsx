import type { DealedRewardItem } from '@endfieldmap/map-service';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { service } from '@/services/map-service';

import { RewardItem } from './reward-item';
import { SubPopupTitle } from './sub-popup-title';
import type { TreasureComponentData } from './types';

function isDealedRewardItemWithCount(
  item: DealedRewardItem,
): item is DealedRewardItem & { type: 'withCount'; count: number } {
  return item.type === 'withCount';
}

interface TreasureComponentProps {
  prop: TreasureComponentData;
}

export function TreasureComponent({ prop }: TreasureComponentProps) {
  const { reward_id } = prop;
  const [rewards, setRewards] = useState<DealedRewardItem[]>([]);
  const { t } = useTranslation(['popup', 'lang']);

  const fetchRewards = useCallback(async () => {
    const data = await service.dataService.chestRewardDataService.getRewards(reward_id);
    return data;
  }, [reward_id]);

  useEffect(() => {
    fetchRewards().then((data) => {
      if (data) setRewards(data);
    });
  }, [fetchRewards]);

  if (!rewards || rewards.length <= 0) {
    return (
      <View className="py-4">
        <Text className="text-center text-sm text-text-muted">
          {t('popup:reward.empty', { defaultValue: '暂无奖励信息' })}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <SubPopupTitle>
        {t('popup:reward.chest.title', { defaultValue: '宝箱奖励' })}
      </SubPopupTitle>
      <View className="flex-row flex-wrap gap-4 px-4 py-3">
        {rewards.map((rwd) => (
          <RewardItem
            key={rwd.id}
            icon={rwd.icon}
            count={isDealedRewardItemWithCount(rwd) ? rwd.count : undefined}
            name={t(`lang:${rwd.name}`, { defaultValue: rwd.name })}
          />
        ))}
      </View>
    </View>
  );
}
