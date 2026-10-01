import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { RouteRenderer } from '@endfieldmap/map-adapter-ol/render/renderer/entity/route/route_renderer';
import type { MapDataJson, RouteRenderItem } from '@endfieldmap/map-core';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteController } from './route_controller';

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

function createMapInstance(): EndfieldMap {
  return { map: { addLayer: vi.fn(), removeLayer: vi.fn() } } as unknown as EndfieldMap;
}

describe('RouteController.buildLinesByMap 未知地图段守卫', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('未知 mapId 的段被跳过：不抛 Invalid map id，其余段正常产出折线', () => {
    const mapDataManager = new MapDataManager(mapDataJson);
    const controller = new RouteController({ mapDataManager, mapInstance: createMapInstance() });
    const setLinesSpy = vi.spyOn(RouteRenderer.prototype, 'setLines');

    const routes: RouteRenderItem[] = [
      {
        id: 'r1',
        segments: [
          { mapId: 'map01', color: '#00FF99', points: [{ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 10 }] },
          { mapId: 'nonexistent', color: '#FF0000', points: [{ x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 2 }] },
        ],
      },
    ];

    // 回归：修复前 xyz2crd 对未知 mapId 抛 'Invalid map id'，整条 setRoutes 链路被击穿
    expect(() => controller.setRoutes(routes)).not.toThrow();

    const lines = setLinesSpy.mock.calls.flatMap((c) => c[0] ?? []);
    expect(lines.filter((l) => l.id.startsWith('r1#'))).toHaveLength(1);

    controller.dispose();
  });

  it('全部段都是未知地图时不抛错、不产出任何折线', () => {
    const mapDataManager = new MapDataManager(mapDataJson);
    const controller = new RouteController({ mapDataManager, mapInstance: createMapInstance() });
    const setLinesSpy = vi.spyOn(RouteRenderer.prototype, 'setLines');

    expect(() =>
      controller.setRoutes([
        { id: 'r2', segments: [{ mapId: 'ghost', points: [{ x: 0, y: 0, z: 0 }] }] },
      ])
    ).not.toThrow();

    const lines = setLinesSpy.mock.calls.flatMap((c) => c[0] ?? []);
    expect(lines.filter((l) => l.id.startsWith('r2#'))).toHaveLength(0);

    controller.dispose();
  });

  it('地图别名（aliases）段不被守卫误杀，且折线进入规范 id 的图层', () => {
    const aliased = {
      version: 'test',
      data: [
        {
          id: 'map01',
          aliases: ['old_map01'],
          name: 'map01',
          center: { x: 0, y: 0, z: 0 },
          scale: 1,
          offset: { x: 0, y: 0, z: 0 },
          electricZoneBaseSize: 80,
          regions: [],
        },
      ],
    } as unknown as MapDataJson;
    const mapDataManager = new MapDataManager(aliased);
    const controller = new RouteController({ mapDataManager, mapInstance: createMapInstance() });
    const setLinesSpy = vi.spyOn(RouteRenderer.prototype, 'setLines');

    expect(() =>
      controller.setRoutes([
        { id: 'r3', segments: [{ mapId: 'old_map01', points: [{ x: 0, y: 0, z: 0 }] }] },
      ])
    ).not.toThrow();

    // 别名段必须真正落到规范 id（map01）渲染器：渲染器按规范 id 索引，
    // 修复前按原始别名 id 分组，setLines 收到空数组——折线画不出来
    expect(setLinesSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'r3#0' })])
    );

    controller.dispose();
  });
});
