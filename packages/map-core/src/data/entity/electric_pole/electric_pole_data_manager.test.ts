import { ElectricPoleIdKey } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleData } from '@endfieldmap/map-core/types/entity';
import { describe, expect, it } from 'vitest';

import { ElectricPoleDataManager } from './electric_pole_data_manager';

function createPole(
  id: number,
  overrides?: Partial<{
    deviceKey: 'pole' | 'repeater' | 'zipline_80' | 'zipline_110';
    connections: number[];
  }>
): ElectricPoleData {
  return {
    levelLogicId: id,
    entityDataIdKey: ElectricPoleIdKey as typeof ElectricPoleIdKey,
    templateId: ElectricPoleIdKey as typeof ElectricPoleIdKey,
    entityType: '#ElectricPole' as const,
    position: { x: id * 10, y: 0, z: id * 10 },
    properties: {
      deviceKey: overrides?.deviceKey ?? 'pole',
      connections: overrides?.connections,
    },
  };
}

describe('ElectricPoleDataManager', () => {
  it('initializes poles, normalizes connections, and exports current graph', () => {
    const manager = new ElectricPoleDataManager({
      mapId: 'map_1' as never,
      initialData: [
        createPole(1, { connections: [2, 2, 999] }),
        createPole(2),
      ],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
        getElectricPoleRangeRadius: () => 100,
      } as never,
    });

    expect(manager.count).toBe(2);
    expect(manager.instances[0]?.outgoingConnectionIds).toEqual([2]);
    expect(manager.instances[1]?.incomingConnections.map((item) => item.id)).toEqual([1]);
    expect(manager.exportData[0]?.properties.connections).toEqual([2]);
  });

  it('adds poles with connection sync and removes poles with cleanup', () => {
    const manager = new ElectricPoleDataManager({
      mapId: 'map_1' as never,
      initialData: [createPole(1), createPole(2)],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
        getElectricPoleRangeRadius: () => 100,
      } as never,
    });

    manager.instances[0]?.connectTo(manager.instances[1]!);
    manager.syncAllConnections();

    const added = manager.addWithConnection(createPole(3, { connections: [1] }));
    expect(added.outgoingConnectionIds).toEqual([1]);
    expect(manager.instances[0]?.incomingConnections.some((item) => item.id === 3)).toBe(true);

    expect(manager.removeWithCleanup(1)).toBe(true);
    expect(manager.getById(1)).toBeUndefined();
    expect(manager.instances[0]?.incomingConnections.some((item) => item.id === 1)).toBe(false);
  });

  it('applies device visibility toggles to matching instances', () => {
    const manager = new ElectricPoleDataManager({
      mapId: 'map_1' as never,
      initialData: [createPole(1, { deviceKey: 'pole' }), createPole(2, { deviceKey: 'zipline_80' })],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
        getElectricPoleRangeRadius: () => 100,
      } as never,
    });

    manager.setDeviceVisible('pole', true);

    expect(manager.getDeviceVisible('pole')).toBe(true);
    expect(manager.instances[0]?.visible).toBe(true);
    expect(manager.instances[1]?.visible).toBe(false);
  });
});
