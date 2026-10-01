import { describe, expect, it } from 'vitest';

import { planCollectionRoute } from './path';

describe('planCollectionRoute', () => {
  it('returns the input as-is for 0 or 1 point', () => {
    expect(planCollectionRoute([]).ordered).toEqual([]);

    const single = [{ id: 1, x: 10, z: 10 }];
    const result = planCollectionRoute(single, { x: 0, z: 0 });
    expect(result.ordered).toEqual(single);
    expect(result.totalDistance).toBeCloseTo(Math.hypot(10, 10));
  });

  it('visits nearer points first when walking a line', () => {
    const points = [
      { id: 3, x: 30, z: 0 },
      { id: 1, x: 10, z: 0 },
      { id: 2, x: 20, z: 0 },
    ];
    const result = planCollectionRoute(points, { x: 0, z: 0 });
    expect(result.ordered.map((point) => point.id)).toEqual([1, 2, 3]);
    expect(result.totalDistance).toBeCloseTo(30);
  });

  it('untangles a crossing that the greedy pass leaves behind', () => {
    // 贪心从起点先扑向最近的 (0,1)，再折回 (10,0)，路径自交；2-opt 应当解开
    const points = [
      { id: 1, x: 0, z: 1 },
      { id: 2, x: 10, z: 0 },
      { id: 3, x: 10, z: 1 },
      { id: 4, x: 0, z: 0 },
    ];
    const result = planCollectionRoute(points, { x: -1, z: 0 });

    expect(result.totalDistance).toBeLessThanOrEqual(result.greedyDistance);
    expect(result.ordered).toHaveLength(4);
    expect(new Set(result.ordered.map((point) => point.id))).toEqual(new Set([1, 2, 3, 4]));
  });

  it('keeps every point exactly once on a larger random set', () => {
    const points = Array.from({ length: 60 }, (_, index) => ({
      id: index,
      x: Math.sin(index * 12.9898) * 500,
      z: Math.cos(index * 78.233) * 500,
    }));
    const result = planCollectionRoute(points, { x: 0, z: 0 });

    expect(result.ordered).toHaveLength(points.length);
    expect(new Set(result.ordered.map((point) => point.id)).size).toBe(points.length);
    expect(result.totalDistance).toBeLessThanOrEqual(result.greedyDistance + 1e-6);
  });

  it('falls back to the first point when no start is given', () => {
    const points = [
      { id: 1, x: 0, z: 0 },
      { id: 2, x: 5, z: 0 },
    ];
    const result = planCollectionRoute(points);
    expect(result.ordered.map((point) => point.id)).toEqual([1, 2]);
    expect(result.totalDistance).toBeCloseTo(5);
  });
});
