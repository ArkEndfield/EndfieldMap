import type { SklandRouteAgg } from '@endfieldmap/map-service/@types/route';
import { describe, expect, it } from 'vitest';

import {
  appendDraftPoint,
  sklandAggToStoredRoute,
  storedRouteToPushSegments,
  undoLastDraftPoint,
} from './route_transform';

// 森空岛路线广场单条聚合（route/info 的 routeAgg / route/index 的元素），
// 形状对齐上游实测：marks 与 markIds 同序，个别 mark 可能缺 pos。
const AGG: SklandRouteAgg = {
  route: {
    routeId: '2086763098657204830',
    title: '武陵-武陵城 收集一条龙',
    description: '作者：测试',
    routeSegments: [
      {
        mapId: 'map02',
        color: '#00FF99',
        markIds: ['aaa', 'bbb', 'ccc'],
        marks: [
          { id: 'aaa', pos: { x: -1384.75, y: 320, z: -292.96 } },
          { id: 'bbb', pos: { x: -100, y: 0, z: 20 } },
          { id: 'ccc' },
        ],
      },
      { mapId: 'map01', markIds: [], marks: [] },
    ],
  },
  poster: { nickname: '木头勺子' },
};

describe('sklandAggToStoredRoute', () => {
  it('converts an upstream agg into a locally stored route with world coords', () => {
    const route = sklandAggToStoredRoute(AGG, 1234, '未命名路线');

    expect(route.source).toBe('skland');
    expect(route.sourceRouteId).toBe('2086763098657204830');
    expect(route.name).toBe('武陵-武陵城 收集一条龙');
    expect(route.author).toBe('木头勺子');
    // 缺 pos 的 mark 与空段都被过滤
    expect(route.segments).toHaveLength(1);
    expect(route.segments[0].mapId).toBe('map02');
    expect(route.segments[0].color).toBe('#00FF99');
    expect(route.segments[0].points).toEqual([
      { x: -1384.75, y: 320, z: -292.96 },
      { x: -100, y: 0, z: 20 },
    ]);
  });

  it('falls back to the untitled name when the upstream title is blank', () => {
    const route = sklandAggToStoredRoute({ route: { routeId: '1', title: '', routeSegments: [] } }, 1, '未命名路线');
    expect(route.name).toBe('未命名路线');
    expect(route.segments).toEqual([]);
  });
});

describe('storedRouteToPushSegments', () => {
  it('keeps only points that map to a local levelLogicId and drops empty segments', () => {
    const segments = storedRouteToPushSegments({
      id: 'r',
      name: 'n',
      source: 'local',
      segments: [
        {
          mapId: 'map01',
          points: [
            { x: 1, y: 0, z: 2, levelLogicId: 111 },
            { x: 3, y: 0, z: 4, levelLogicId: 222 },
            { x: 5, y: 0, z: 6 },
          ],
        },
        { mapId: 'map02', points: [{ x: 7, y: 0, z: 8 }] },
      ],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(segments).toEqual([{ mapId: 'map01', color: undefined, levelLogicIds: [111, 222] }]);
  });
});

describe('draft point collection', () => {
  it('appends points into per-map segments keeping first-appearance order', () => {
    let draft = appendDraftPoint([], 'map01', { x: 1, y: 2, z: 3, levelLogicId: 42 });
    draft = appendDraftPoint(draft, 'map01', { x: 4, y: 5, z: 6, levelLogicId: 43 });
    draft = appendDraftPoint(draft, 'map02', { x: 7, y: 8, z: 9, levelLogicId: 44 });

    expect(draft).toEqual([
      {
        mapId: 'map01',
        points: [
          { x: 1, y: 2, z: 3, levelLogicId: 42 },
          { x: 4, y: 5, z: 6, levelLogicId: 43 },
        ],
      },
      { mapId: 'map02', points: [{ x: 7, y: 8, z: 9, levelLogicId: 44 }] },
    ]);
  });

  it('undoes the last point across segments and removes emptied ones', () => {
    let draft = appendDraftPoint([], 'map01', { x: 1, y: 2, z: 3, levelLogicId: 42 });
    draft = appendDraftPoint(draft, 'map02', { x: 7, y: 8, z: 9, levelLogicId: 44 });

    draft = undoLastDraftPoint(draft);
    expect(draft.map((s) => s.mapId)).toEqual(['map01']);

    draft = undoLastDraftPoint(draft);
    expect(draft).toEqual([]);

    // 空列表再撤销也不出错
    expect(undoLastDraftPoint([])).toEqual([]);
  });
});
