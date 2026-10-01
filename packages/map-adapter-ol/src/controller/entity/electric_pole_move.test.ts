import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { ElectricPoleData, ElectricPoleDeviceKey, EndfieldMapAsset } from '@endfieldmap/map-core';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { describe, expect, it, vi } from 'vitest';

import { ElectricPoleController } from './electric_pole_controller';

type MapDataJsonLike = ConstructorParameters<typeof MapDataManager>[0];

const mapData: MapDataJsonLike = {
  version: 'test',
  data: [
    {
      id: 'map01',
      name: 'map01',
      center: { x: 0, y: 0, z: 0 },
      scale: 1,
      offset: { x: 0, y: 0, z: 0 },
      // base=80 且无 rangeRadiusByMapId 覆盖时，zoneRadius = rangeMeters（pole=30 / repeater=80）
      electricZoneBaseSize: 80,
      regions: [],
    },
  ],
} as unknown as MapDataJsonLike;

function createController(): ElectricPoleController {
  const mapInstance = { map: { addLayer: vi.fn(), removeLayer: vi.fn() } } as unknown as EndfieldMap;
  const asset = { entityImage: '/assets/entity' } as unknown as EndfieldMapAsset;
  return new ElectricPoleController({
    mapDataManager: new MapDataManager(mapData),
    mapInstance,
    asset,
  });
}

function poleData(id: number, x: number, z: number, deviceKey: ElectricPoleDeviceKey): ElectricPoleData {
  return {
    levelLogicId: id,
    entityDataIdKey: '#electric_pole' as ElectricPoleData['entityDataIdKey'],
    templateId: '#electric_pole' as ElectricPoleData['templateId'],
    entityType: '#ElectricPole',
    position: { x, y: 0, z },
    properties: { deviceKey },
  };
}

describe('ElectricPoleController.updateElectricPolePosition 连线距离校验（任一方可达）', () => {
  it('混合连接（中继器80↔电线杆30，距40）：移动后仍在任一方覆盖内即可，不再抛错', () => {
    const controller = createController();
    // 直接经数据层填充（node 环境无 DOM Image，controller.addElectricPoleData 会创建渲染器）
    const manager = controller.dataManager.getMapManager('map01');
    const repeater = manager.addWithConnection(poleData(1, 0, 0, 'repeater'));
    manager.addWithConnection(poleData(2, 10, 0, 'pole'));
    controller.connectElectricPoles('map01', 1, 2);

    // 移动 repeater 到距 pole 40 处：40 > 30（对方半径）但 ≤ 80（自身半径）。
    // 回归：修复前 move 校验要求双方都在各自 zone 内，此移动会抛错、两端杆被锁死
    expect(() => controller.updateElectricPolePosition('map01', 1, [50, 0])).not.toThrow();
    expect(repeater.coordinates).toEqual([50, 0]);

    controller.dispose();
  });

  it('距离超过双方覆盖范围时移动仍被拒绝', () => {
    const controller = createController();
    const manager = controller.dataManager.getMapManager('map01');
    manager.addWithConnection(poleData(1, 0, 0, 'repeater'));
    manager.addWithConnection(poleData(2, 10, 0, 'pole'));
    controller.connectElectricPoles('map01', 1, 2);

    // 距 pole 190：> 80 且 > 30，双方都不可达
    expect(() => controller.updateElectricPolePosition('map01', 1, [200, 0])).toThrow(/zone radius/);

    controller.dispose();
  });
});
