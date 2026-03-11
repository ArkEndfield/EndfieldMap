import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import React from 'react';

import { DungeonEntryComponent } from './dungeon-entry';
import { InteractiveLockComponent } from './interactive-lock';
import { TreasureComponent } from './treasure';

const rightContentMap: Record<string, React.ComponentType<{ prop: unknown }>> = {
  InteractiveLockComponent: InteractiveLockComponent as React.ComponentType<{ prop: unknown }>,
  DungeonEntryComponent: DungeonEntryComponent as React.ComponentType<{ prop: unknown }>,
  TreasureComponent: TreasureComponent as React.ComponentType<{ prop: unknown }>,
};

export function getRightComponents(
  entity?: EntityData | CustomPointData | ElectricPoleData,
): React.ReactElement[] {
  if (!entity) return [];

  if (!('componentProperties' in entity) || !entity.componentProperties) return [];

  return Object.entries(entity.componentProperties)
    .map(([key, prop]) => {
      if (key in rightContentMap) {
        const Component = rightContentMap[key];
        return <Component key={key} prop={prop} />;
      }
      return null;
    })
    .filter((item): item is React.ReactElement => item !== null);
}
