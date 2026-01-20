import type { EntityData } from '@endfieldmap/map-core';
import { ChestReward } from '@themes/endfield/ui/popup/right_content/chest_reward';
import { DeltaRobot } from '@themes/endfield/ui/popup/right_content/delta_robot';
import { DungeonReward } from '@themes/endfield/ui/popup/right_content/dungeon_reward';

import { hasChestReward, hasDeltaRobot, hasDungeonReward } from '@/utils/reward';

import { useEffect, useState } from 'react';

export interface RightContentItem {
  id: string;
  Component: React.FC<{ entity: EntityData }>;
  check: (entity?: EntityData) => boolean | Promise<boolean>;
}

export const rightContentItems: RightContentItem[] = [
  {
    id: 'chest_reward',
    Component: ChestReward,
    check: hasChestReward,
  },
  {
    id: 'dungeon_reward',
    Component: DungeonReward,
    check: hasDungeonReward,
  },
  {
    id: 'delta_robot',
    Component: DeltaRobot,
    check: hasDeltaRobot,
  },
];

export const useVisibleRightContentItems = (entity?: EntityData) => {
  const [items, setItems] = useState<RightContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const showSubPopup = items.length > 0;

  useEffect(() => {
    let active = true;
    const checkVisibility = async () => {
      if (!entity) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          rightContentItems.map(async (item) => {
            try {
              const result = await item.check(entity);
              return result ? item : null;
            } catch (e) {
              console.error(`Error checking visibility for ${item.id}`, e);
              return null;
            }
          })
        );
        if (active) {
          setItems(results.filter((i): i is RightContentItem => i !== null));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkVisibility();

    return () => {
      active = false;
    };
  }, [entity]);

  return { items, loading, showSubPopup };
};
