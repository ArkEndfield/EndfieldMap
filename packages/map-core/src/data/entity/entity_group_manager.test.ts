import { describe, expect, it } from 'vitest';

import type { EntityData, EntityInfoData } from '@endfieldmap/map-core/types/entity';

import { EntityGroupManager } from './entity_group_manager';

function createEntity(id: number, entityInfo: EntityInfoData): EntityData {
  return {
    levelLogicId: id,
    entityDataIdKey: entityInfo.entityInfo.point,
    templateId: `template_${id}`,
    entityType: '#Entity',
    position: { x: id, y: 0, z: id },
    properties: {},
    progressLockCondition: {},
    componentProperties: {},
    entityInfo,
  };
}

describe('EntityGroupManager', () => {
  it('initializes from config and exposes derived metadata', () => {
    const entityInfo: EntityInfoData = {
      category: 'enemy',
      entityInfo: {
        point: 'enemy_1',
        pic: 'enemy-icon',
      },
    };

    const manager = new EntityGroupManager({
      mapId: 'map_1' as never,
      entityDataIdKey: 'enemy_1',
      entityInfo,
      category: 'enemy',
      initialData: [createEntity(1, entityInfo), createEntity(2, entityInfo)],
      mapDataManager: {} as never,
    });

    expect(manager.count).toBe(2);
    expect(manager.uniqueKey).toBe('map_1-enemy-enemy_1');
    expect(manager.iconName).toBe('enemy-icon');
    expect(manager.category).toBe('enemy');
    expect(manager.groupVisible).toBe(false);
  });

  it('updates group visibility and stats from instance state', () => {
    const entityInfo: EntityInfoData = {
      category: 'enemy',
      entityInfo: {
        point: 'enemy_1',
        pic: 'enemy-icon',
      },
    };

    const manager = new EntityGroupManager({
      mapId: 'map_1' as never,
      entityDataIdKey: 'enemy_1',
      entityInfo,
      category: 'enemy',
      initialData: [createEntity(1, entityInfo), createEntity(2, entityInfo)],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
      } as never,
    });

    manager.instances[0]?.setMarked(true);
    manager.instances[1]?.setSelected(true);
    manager.setGroupVisible(true);

    expect(manager.stats).toEqual({
      uniqueKey: 'map_1-enemy-enemy_1',
      category: 'enemy',
      entityDataIdKey: 'enemy_1',
      entityInfo: entityInfo.entityInfo,
      visible: true,
      count: 2,
      markedCount: 1,
      selectedCount: 1,
      mapId: 'map_1',
    });
  });
});
