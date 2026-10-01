import type { ElectricPoleNodeData, MapDataJson } from '@endfieldmap/map-core';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { describe, expect, it } from 'vitest';

import { ElectricPoleController } from './electric_pole_controller';

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

function createController(): ElectricPoleController {
  return new ElectricPoleController({ mapDataManager: new MapDataManager(mapDataJson) });
}

function node(mapId: string, id: number, x: number, connections: number[] = []): ElectricPoleNodeData {
  return {
    mapId,
    levelLogicId: id,
    entityDataIdKey: '#electric_pole',
    templateId: '#electric_pole',
    entityType: '#ElectricPole',
    position: { x, y: 0, z: 0 },
    properties: { deviceKey: 'pole', connections },
  };
}

describe('ElectricPoleController（maplibre）load 清空语义', () => {
  it('loadElectricPoleData 全量替换：空数组兜底不再是 no-op', () => {
    const controller = createController();
    controller.loadElectricPoleData([node('map01', 1, 0), node('map01', 2, 10)]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(2);

    // 回归：修复前空数组输入时循环体不执行、也无 clearAllMaps，损坏预设兜底路径是纯 no-op
    controller.loadElectricPoleData([]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(0);
  });

  it('切换预设后缺席地图的数据被清空（不残留旧预设的幽灵杆）', () => {
    const controller = createController();
    controller.loadElectricPoleData([node('map01', 1, 0), node('map02', 1, 0)]);

    // 新预设只有 map01 的杆：map02 的旧数据必须消失
    controller.loadElectricPoleData([node('map01', 5, 100)]);
    expect(controller.dataManager.getMapManager('map01').instances).toHaveLength(1);
    expect(controller.dataManager.getMapManager('map02').instances).toHaveLength(0);
  });
});

describe('ElectricPoleController（maplibre）deleteElectricPole 连接清理', () => {
  it('删除已连接的杆会同步摘除邻杆的出边引用（removeWithCleanup）', () => {
    const controller = createController();
    controller.loadElectricPoleData([node('map01', 1, 0, [2]), node('map01', 2, 10)]);
    const manager = controller.dataManager.getMapManager('map01');
    expect(manager.getById(1)!.outgoingConnections).toHaveLength(1);

    // 回归：修复前用 manager.remove（不清连接），邻杆 outgoing 残留、connectionCount 虚高
    expect(controller.deleteElectricPole('map01', 2)).toBe(true);
    expect(manager.getById(1)!.outgoingConnections).toHaveLength(0);
    expect(manager.getById(1)!.data.properties.connections).toHaveLength(0);
    expect(manager.getById(2)).toBeUndefined();
  });
});
