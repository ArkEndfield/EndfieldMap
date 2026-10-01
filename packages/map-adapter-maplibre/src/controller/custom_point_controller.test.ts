import type { CustomPointNodeData, MapDataJson } from '@endfieldmap/map-core';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { describe, expect, it } from 'vitest';

import { CustomPointController } from './custom_point_controller';

const mapDataJson = {
  version: 'test',
  data: [
    {
      id: 'map01',
      name: 'map01',
      center: { x: 0, y: 0, z: 0 },
      scale: 1,
      offset: { x: 0, y: 0, z: 0 },
      electricZoneBaseSize: 80,
      regions: [],
    },
    {
      id: 'map02',
      name: 'map02',
      center: { x: 0, y: 0, z: 0 },
      scale: 1,
      offset: { x: 0, y: 0, z: 0 },
      electricZoneBaseSize: 80,
      regions: [],
    },
  ],
} as unknown as MapDataJson;

function createController(): CustomPointController {
  return new CustomPointController({ mapDataManager: new MapDataManager(mapDataJson) });
}

function node(mapId: string, id: number, x: number): CustomPointNodeData {
  return {
    mapId,
    levelLogicId: id,
    entityDataIdKey: 'default',
    templateId: '#custom_point',
    entityType: '#CustomPoint',
    position: { x, y: 0, z: 0 },
    properties: {},
  };
}

describe('CustomPointController（maplibre）load 清空语义', () => {
  it('loadCustomPointData 全量替换：空数组兜底不再是 no-op', () => {
    const controller = createController();
    controller.loadCustomPointData([node('map01', 1, 0), node('map01', 2, 10)]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(2);

    // 回归：修复前空数组输入时循环体不执行、也无 clearAllMaps，损坏预设兜底路径是纯 no-op
    controller.loadCustomPointData([]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(0);
  });

  it('切换预设后缺席地图的数据被清空（不残留旧预设的幽灵点）', () => {
    const controller = createController();
    controller.loadCustomPointData([node('map01', 1, 0), node('map02', 1, 0)]);

    // 新预设只有 map01 的点：map02 的旧数据必须消失
    controller.loadCustomPointData([node('map01', 5, 100)]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(1);
    expect(controller.dataManager.getMapManager('map02').instances).toHaveLength(0);
  });

  it('正常加载按 mapId 分组且 dataVersion 递增（渲染层可观察）', () => {
    const controller = createController();
    const before = controller.dataVersion;
    controller.loadCustomPointData([node('map01', 1, 0), node('map02', 2, 5)]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(1);
    expect(controller.dataManager.getMapManager('map02').instances).toHaveLength(1);
    expect(controller.dataVersion).toBeGreaterThan(before);
  });
});
