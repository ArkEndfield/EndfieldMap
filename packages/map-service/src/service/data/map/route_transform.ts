import type {
  SklandRouteAgg,
  SklandRoutePushSegment,
  StoredRoute,
  StoredRoutePoint,
  StoredRouteSegment,
} from '@endfieldmap/map-service/@types/route';

/**
 * 路线数据转换（纯函数，无 MobX / 无副作用）。
 *
 * 拆出独立模块既方便单测（vitest 无法解析 mobx 装饰器语法，见 skland_sync.test
 * 顶注），也让「森空岛 wire 形状 <-> 本地存储形状」的映射知识集中在一处。
 */

/** 森空岛路线聚合 → 本地存储路线。没有坐标的点与空段会被丢弃。 */
export function sklandAggToStoredRoute(agg: SklandRouteAgg, now: number, untitledName: string): StoredRoute {
  const segments: StoredRouteSegment[] = [];
  for (const seg of agg.route?.routeSegments ?? []) {
    const points: StoredRoutePoint[] = (seg.marks ?? [])
      .filter((mark) => mark.pos)
      .map((mark) => ({ x: mark.pos!.x, y: mark.pos!.y, z: mark.pos!.z }));
    if (points.length > 0) {
      segments.push({ mapId: seg.mapId, color: seg.color, points });
    }
  }
  return {
    id: `route_skland_${agg.route?.routeId ?? now}`,
    name: agg.route?.title || untitledName,
    description: agg.route?.description ?? '',
    source: 'skland',
    sourceRouteId: agg.route?.routeId,
    author: agg.poster?.nickname ?? '',
    segments,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 本地存储路线 → 发布路段：只保留带 levelLogicId 的点（森空岛以
 * md5(levelLogicId) 定位点位），没有可发布点位的整段丢弃。
 */
export function storedRouteToPushSegments(route: StoredRoute): SklandRoutePushSegment[] {
  return route.segments
    .map((seg) => ({
      mapId: seg.mapId,
      color: seg.color,
      levelLogicIds: seg.points.map((p) => p.levelLogicId).filter((id): id is number => typeof id === 'number'),
    }))
    .filter((seg) => seg.levelLogicIds.length > 0);
}

/** 描点按点击顺序追加；切换地图后新建一段。 */
export function appendDraftPoint(
  segments: StoredRouteSegment[],
  mapId: string,
  point: StoredRoutePoint
): StoredRouteSegment[] {
  const next = segments.map((seg) => ({ ...seg, points: [...seg.points] }));
  let segment = next.at(-1);
  if (!segment || segment.mapId !== mapId) {
    segment = { mapId, points: [] };
    next.push(segment);
  }
  segment.points.push(point);
  return next;
}

/** 撤销草稿最后一个点（可跨段回退）；空段随之移除。 */
export function undoLastDraftPoint(segments: StoredRouteSegment[]): StoredRouteSegment[] {
  const next = segments.map((seg) => ({ ...seg, points: [...seg.points] }));
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].points.length > 0) {
      next[i].points.pop();
      if (next[i].points.length === 0) next.splice(i, 1);
      break;
    }
  }
  return next;
}
