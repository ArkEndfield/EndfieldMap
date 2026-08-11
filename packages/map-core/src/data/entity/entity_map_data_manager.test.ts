import { describe, expect, it } from 'vitest';

import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import type { EntityInfoDataJson, EntityJsonDataList } from '@endfieldmap/map-core/types/entity';

import { EntityMapDataManager } from './entity_map_data_manager';

function createMapDataManager() {
  return {
    currentMapId: 'map_1',
  } as never;
}

function createJsonData(): EntityJsonDataList {
  return [
    {
      map_id: 'map_1',
      levels: [
        {
          map_level_id: 'lv1',
          categories: [
            {
              category: 'enemy',
              data: [
                {
                  levelLogicId: 1,
                  entityDataIdKey: 'enemy_a',
                  templateId: 'enemy_template',
                  entityType: '#Entity',
                  position: { x: 1, y: 0, z: 2 },
                  properties: {},
                  progressLockCondition: {},
                  componentProperties: {},
                  mapRegionId: 0,
                },
                {
                  levelLogicId: 2,
                  entityDataIdKey: 'enemy_a',
                  templateId: 'enemy_template',
                  entityType: '#Entity',
                  position: { x: 3, y: 0, z: 4 },
                  properties: {},
                  progressLockCondition: {},
                  componentProperties: {},
                  mapRegionId: 0,
                },
              ],
            },
          ],
        },
        {
          map_level_id: 'lv2',
          categories: [
            {
              category: 'enemy',
              data: [
                {
                  levelLogicId: 3,
                  entityDataIdKey: 'enemy_a',
                  templateId: 'enemy_template',
                  entityType: '#Entity',
                  position: { x: 5, y: 0, z: 6 },
                  properties: {},
                  progressLockCondition: {},
                  componentProperties: {},
                  mapRegionId: 0,
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function createInfoData(): EntityInfoDataJson {
  return {
    enemy_a: {
      category: 'enemy',
      entityInfo: {
        point: 'enemy_a',
        pic: 'enemy-icon',
      },
    },
  };
}

describe('EntityMapDataManager', () => {
  it('loads grouped entity data and exposes current stats', async () => {
    const manager = new EntityMapDataManager(createMapDataManager());

    await manager.loadData(createJsonData(), createInfoData());

    expect(manager.dataLoaded).toBe(true);
    expect(manager.currentGroupManagers).toHaveLength(1);
    expect(manager.currentGroupManagers[0]?.count).toBe(3);
    expect(manager.getMapLevelIds('map_1')).toEqual(['lv1', 'lv2']);
    expect([...manager.getSelectedLevelIds('map_1')]).toEqual(['lv1', 'lv2']);
    expect(manager.currentStats).toEqual([
      expect.objectContaining({
        entityDataIdKey: 'enemy_a',
        count: 3,
        category: 'enemy',
      }),
    ]);
  });

  it('looks up instances and updates visibility / marked state', async () => {
    const manager = new EntityMapDataManager(createMapDataManager());
    await manager.loadData(createJsonData(), createInfoData());

    const instance = manager.getInstanceById('map_1', 1);
    expect(instance?.id).toBe(1);

    manager.setMarked('map_1', 1, true);
    expect(instance?.marked).toBe(true);

    manager.setGroupVisibility('map_1', 'enemy_a', true);
    expect(manager.currentGroupManagers[0]?.groupVisible).toBe(true);
  });

  it('filters current stats by selected levels without dropping instances or marks', async () => {
    const manager = new EntityMapDataManager(createMapDataManager());
    await manager.loadData(createJsonData(), createInfoData());

    manager.setLevelSelected('map_1', 'lv2', false);

    expect(manager.currentStats).toEqual([
      expect.objectContaining({
        entityDataIdKey: 'enemy_a',
        count: 2,
        markedCount: 0,
      }),
    ]);

    const hiddenLevelInstance = manager.getInstanceById('map_1', 3);
    expect(hiddenLevelInstance?.data.mapLevelId).toBe('lv2');

    manager.setMarked('map_1', 3, true);
    expect(hiddenLevelInstance?.marked).toBe(true);
    expect(manager.currentStats[0]?.markedCount).toBe(0);

    manager.setLevelSelected('map_1', 'lv2', true);
    expect(manager.currentStats[0]).toEqual(
      expect.objectContaining({
        count: 3,
        markedCount: 1,
      })
    );
  });

  it('imports visibility data and updates filter flags', async () => {
    const manager = new EntityMapDataManager(createMapDataManager());
    await manager.loadData(createJsonData(), createInfoData());

    const imported = await manager.importVisibilityData({
      map_1: {
        enemy_a: true,
      },
    });

    expect(imported).toBe(1);
    expect(manager.currentGroupManagers[0]?.groupVisible).toBe(true);

    manager.setMarkedFilterMode(MarkedFeatureFilterMode.Marked);
    manager.setDisableCluster(true);

    expect(manager.markedFilterMode).toBe(MarkedFeatureFilterMode.Marked);
    expect(manager.disableCluster).toBe(true);
  });
});
