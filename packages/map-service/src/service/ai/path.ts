/**
 * 采集路径规划。
 *
 * 这是一条开放路径的 TSP（有起点、不要求回到起点）：先最近邻构造初始解，
 * 再用 2-opt 反复消除交叉。点位量在几十到几百之间，2-opt 的 O(n²) 每轮开销
 * 完全可接受，且结果比纯贪心稳定好一截。
 *
 * 距离用游戏世界坐标的水平欧氏距离（x/z 平面）。高度差 y 不计入：终末地里
 * 上下层通常靠固定的楼梯/传送点连通，把 y 掺进直线距离只会让排序更离谱。
 */

export interface RoutePlanPoint {
  id: number;
  x: number;
  z: number;
}

export interface RoutePlanResult<T extends RoutePlanPoint> {
  /** 按采集顺序排好的点位 */
  ordered: T[];
  /** 路径总长（世界坐标单位），含起点到第一个点的那一段 */
  totalDistance: number;
  /** 优化前（最近邻贪心解）的总长，用于展示优化幅度 */
  greedyDistance: number;
}

/** 2-opt 的最大轮数。超过这个轮数收益已经很小，不值得再卡住主线程。 */
const MAX_2OPT_PASSES = 30;

/** 超过这个点位数就跳过 2-opt，只保留贪心结果，避免长时间阻塞。 */
export const MAX_2OPT_POINTS = 400;

function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function pathLength(start: { x: number; z: number } | undefined, points: RoutePlanPoint[]): number {
  if (points.length === 0) return 0;
  let total = start ? distance(start, points[0]) : 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/** 最近邻贪心：每次从当前位置跳到最近的未访问点。 */
function nearestNeighbor<T extends RoutePlanPoint>(start: { x: number; z: number } | undefined, points: T[]): T[] {
  const remaining = [...points];
  const ordered: T[] = [];
  let cursor = start ?? remaining[0];

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(cursor, remaining[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = next;
  }

  return ordered;
}

/**
 * 2-opt：反转任意一段子路径，若总长变短则保留。起点固定不参与反转。
 */
function twoOpt<T extends RoutePlanPoint>(start: { x: number; z: number } | undefined, points: T[]): T[] {
  const route = [...points];
  if (route.length < 4) return route;

  const head = start;
  for (let pass = 0; pass < MAX_2OPT_PASSES; pass++) {
    let improved = false;

    for (let i = 0; i < route.length - 1; i++) {
      const prev = i === 0 ? head : route[i - 1];
      for (let k = i + 1; k < route.length; k++) {
        const next = k + 1 < route.length ? route[k + 1] : undefined;

        // 只需比较被打断的两条边：(prev,route[i]) + (route[k],next)
        // 换成 (prev,route[k]) + (route[i],next)，中间段整体反转长度不变
        const before = (prev ? distance(prev, route[i]) : 0) + (next ? distance(route[k], next) : 0);
        const after = (prev ? distance(prev, route[k]) : 0) + (next ? distance(route[i], next) : 0);

        if (after + 1e-9 < before) {
          let left = i;
          let right = k;
          while (left < right) {
            [route[left], route[right]] = [route[right], route[left]];
            left++;
            right--;
          }
          improved = true;
        }
      }
    }

    if (!improved) break;
  }

  return route;
}

/**
 * 规划采集顺序。
 *
 * @param points 待采集点位（同一张地图）
 * @param start 出发点（一般是当前视图中心或玩家位置）；不给就以第一个点为起点
 */
export function planCollectionRoute<T extends RoutePlanPoint>(
  points: T[],
  start?: { x: number; z: number }
): RoutePlanResult<T> {
  if (points.length <= 1) {
    return {
      ordered: [...points],
      totalDistance: pathLength(start, points),
      greedyDistance: pathLength(start, points),
    };
  }

  const greedy = nearestNeighbor(start, points);
  const greedyDistance = pathLength(start, greedy);

  const ordered = points.length > MAX_2OPT_POINTS ? greedy : twoOpt(start, greedy);
  return { ordered, totalDistance: pathLength(start, ordered), greedyDistance };
}
