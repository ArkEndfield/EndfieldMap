import { ElectricPoleIdKey } from '@endfieldmap/map-core/const/map';
import { ElectricPoleError } from '@endfieldmap/tools';
import { describe, expect, it } from 'vitest';

import { ElectricPoleDataInstance } from './electric_pole_data_instance';

function createPole(
  id: number,
  overrides?: Partial<{
    deviceKey: 'pole' | 'repeater' | 'zipline_80' | 'zipline_110';
    name: string;
    position: { x: number; y: number; z: number };
    connections: number[];
  }>
) {
  return new ElectricPoleDataInstance({
    data: {
      levelLogicId: id,
      entityDataIdKey: ElectricPoleIdKey,
      templateId: ElectricPoleIdKey,
      entityType: '#ElectricPole',
      position: overrides?.position ?? { x: id * 10, y: 0, z: id * 10 },
      properties: {
        deviceKey: overrides?.deviceKey ?? 'pole',
        name: overrides?.name,
        connections: overrides?.connections,
      },
      entityInfo: {
        category: ElectricPoleIdKey,
        entityInfo: {
          point: ElectricPoleIdKey,
          pic: 'electric_pole',
        },
      },
    },
    mapId: 'map_1' as never,
    mapDataManager: {
      xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
      getElectricPoleRangeRadius: () => 100,
    } as never,
  });
}

describe('ElectricPoleDataInstance', () => {
  it('exposes coordinates, device-derived icon, and default name', () => {
    const pole = createPole(1, { deviceKey: 'zipline_80' });

    expect(pole.coordinates).toEqual([10, 10]);
    expect(pole.deviceKey).toBe('zipline_80');
    expect(pole.entityInfo.entityInfo.pic).toBe('item_port_travel_pole_1');
    expect(pole.name).toBe('ElectricPole #1');
    expect(pole.markable).toBe(false);
    expect(pole.selectable).toBe(false);
    expect(pole.renameable).toBe(true);
  });

  it('updates position, outgoing ids, and connection references', () => {
    const a = createPole(1, { connections: [2, 3, 'x' as never] });
    const b = createPole(2);

    expect(a.outgoingConnectionIds).toEqual([2, 3]);

    a.connectTo(b);
    expect(a.isConnectedTo(2)).toBe(true);
    expect(a.connectionCount).toBe(1);
    expect(b.connectionCount).toBe(1);

    expect(a.disconnectOutgoingTo(2)).toBe(true);
    expect(a.isConnectedTo(2)).toBe(false);

    a.updatePosition({ x: 99, y: 0, z: 88 });
    a.rename('Pole A');
    a.setOutgoingConnectionIds([5]);

    expect(a.coordinates).toEqual([99, 88]);
    expect(a.name).toBe('Pole A');
    expect(a.outgoingConnectionIds).toEqual([5]);
  });

  it('rejects invalid connections and clears all connections', () => {
    const a = createPole(1, { deviceKey: 'pole' });
    const b = createPole(2, { deviceKey: 'zipline_80' });
    const c = createPole(3, { deviceKey: 'pole' });

    expect(() => a.assertCanConnectTo(a)).toThrow(ElectricPoleError);
    expect(() => a.assertCanConnectTo(b)).toThrow('different_connection_type');

    a.connectTo(c);
    expect(() => a.assertCanConnectTo(c)).toThrow('already_connected');

    a.clearAllConnections();
    expect(a.connectionCount).toBe(0);
    expect(c.connectionCount).toBe(0);
  });
});
