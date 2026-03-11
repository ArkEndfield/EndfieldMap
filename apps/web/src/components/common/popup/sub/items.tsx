import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import { type ElementType, lazy } from 'react';

export const rightContentMap = {
  InteractiveLockComponent: lazy(() => import('@/components/common/popup/sub/components/interactive_lock_component')),
  DungeonEntryComponent: lazy(() => import('@/components/common/popup/sub/components/dungeon_entry_component')),
  TreasureComponent: lazy(() => import('@/components/common/popup/sub/components/treasure_component')),
} as const;

export const getRightComponents = (entity?: EntityData | CustomPointData | ElectricPoleData) => {
  if (!entity) return [];

  // 类型守卫：检查 entity 是否有 componentProperties 字段（即是 EntityData）
  if (!('componentProperties' in entity) || !entity.componentProperties) return [];

  return Object.entries(entity.componentProperties)
    .map(([_key, prop]) => {
      const key = _key as keyof typeof rightContentMap;
      if (key in rightContentMap) {
        const Component = rightContentMap[key] as ElementType;
        return <Component key={key} prop={prop} />;
      }
      return null;
    })
    .filter(Boolean);
};
