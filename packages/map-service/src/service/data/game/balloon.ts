import type {
  BalloonCounts,
  BalloonLevelData,
  BalloonLift,
  BalloonPlacement,
  BalloonSolveOptions,
  BalloonSolveResult,
  ParsedBalloonLevel,
} from '@endfieldmap/map-service/@types/balloon';
import { BALLOON_LIFT_TYPES } from '@endfieldmap/map-service/@types/balloon';
import { AssetService } from '@endfieldmap/map-service/service/asset';
import { type JSONLoader, logger } from '@endfieldmap/tools';

export interface BalloonConfig {
  jsonLoader: JSONLoader;
  assetService: AssetService;
}

/** correctAnswer.lift 的高位标志（疑似编辑器出处标记），需剥离后才是真实浮力 */
const ANSWER_FLAG = 0x10;

const DEFAULT_MAX_SOLUTIONS = 2000;
const DEFAULT_MAX_NODES = 20_000_000;
const PROGRESS_INTERVAL = 1 << 16;

/** 从大到小尝试浮力，大浮力约束强、失败早 */
const LIFTS_DESC = [...BALLOON_LIFT_TYPES].sort((a, b) => b - a);

/**
 * 浮空回收（Aero-Salvage）小游戏数据服务。
 * 关卡数据与 delta_robot 同源，走统一 minigame 路径 /balloon/<levelId>.json。
 */
export class BalloonService {
  private jsonLoader: JSONLoader;
  private assetService: AssetService;
  private levelCache = new Map<string, ParsedBalloonLevel>();

  /** 浮力 → 颜色（浮力越大越暖） */
  public LIFT_COLOR_MAP: Record<BalloonLift, string> = {
    1: '#5AA7D6',
    2: '#4CB98F',
    3: '#E39A3B',
    6: '#D95F4C',
  };

  /**
   * 官方关卡清单（CDN 无目录索引，静态内置）。
   * 1xxx/2xxx/3xxx = 浮空回收器 I/II/III；注意没有 3011。
   */
  public LEVEL_IDS: string[] = [
    '1001',
    '1002',
    '1003',
    '1004',
    '1005',
    '1006',
    '1007',
    '1008',
    '1009',
    '1010',
    '1011',
    '1012',
    '1013',
    '1014',
    '1015',
    '2001',
    '2002',
    '2003',
    '2004',
    '2005',
    '2006',
    '2007',
    '2008',
    '2009',
    '2010',
    '2011',
    '2012',
    '2013',
    '3001',
    '3002',
    '3003',
    '3004',
    '3005',
    '3006',
    '3007',
    '3008',
    '3009',
    '3010',
    '3012',
    '3013',
    '3014',
    '3015',
    '3016',
    '3017',
  ];

  constructor(config: BalloonConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetService = config.assetService;
  }

  public async getLevelData(levelId: string): Promise<ParsedBalloonLevel | null> {
    const cached = this.levelCache.get(levelId);
    if (cached) return cached;

    try {
      const levelUrl = `${this.assetService.url.miniGameData}/balloon/${levelId}.json`;
      const raw = await this.jsonLoader.loadJSON<BalloonLevelData>(levelUrl);
      const parsed = this.parseLevelData(raw);
      this.levelCache.set(levelId, parsed);
      return parsed;
    } catch (error) {
      logger.error(`Failed to load balloon level ${levelId}:`, error);
      return null;
    }
  }

  private parseLevelData(raw: BalloonLevelData): ParsedBalloonLevel {
    return {
      levelId: raw.levelId,
      propLevel: raw.propLevel,
      boardSizeX: raw.boardSizeX,
      boardSizeY: raw.boardSizeY,
      placeableSpots: raw.placeableSpots,
      balloonConfig: {
        1: raw.balloonConfig?.lift1 ?? 0,
        2: raw.balloonConfig?.lift2 ?? 0,
        3: raw.balloonConfig?.lift3 ?? 0,
        6: raw.balloonConfig?.lift6 ?? 0,
      },
      gravityConfig: raw.gravityConfig,
      correctAnswer: (raw.correctAnswer ?? []).map((entry) => ({
        x: entry.x,
        y: entry.y,
        lift: (entry.lift & ~ANSWER_FLAG) as BalloonLift,
        flagged: (entry.lift & ANSWER_FLAG) !== 0,
      })),
    };
  }

  // region: solver

  /**
   * 求解：把全部气球放到可放置格上，使每轴归一化重心落入
   * |CoG − target| ≤ maxDeviation（官方关 target=(0,0)、容差 0，
   * 等价于 Σ(lift·x)=Σ(lift·y)=0 的纯力矩平衡）。
   * DFS + 逐轴力矩可达界剪枝，官方关全量枚举均在毫秒级。
   */
  public solveLevel(level: ParsedBalloonLevel, options: BalloonSolveOptions = {}): BalloonSolveResult {
    const started = performance.now();
    const maxSolutions = options.maxSolutions ?? DEFAULT_MAX_SOLUTIONS;
    const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
    const spots = level.placeableSpots;
    const n = spots.length;
    const counts: BalloonCounts = { ...level.balloonConfig };
    const totalBalloons = BALLOON_LIFT_TYPES.reduce((s, t) => s + counts[t], 0);
    const totalLift = BALLOON_LIFT_TYPES.reduce((s, t) => s + counts[t] * t, 0);

    const done = (solutions: BalloonPlacement[], truncated: boolean, nodes: number): BalloonSolveResult => ({
      solutions,
      truncated,
      nodes,
      elapsedMs: performance.now() - started,
    });

    const halfX = Math.floor(level.boardSizeX / 2) || 1;
    const halfY = Math.floor(level.boardSizeY / 2) || 1;
    const g = level.gravityConfig;
    const EPS = 1e-9;

    // 容量不足直接无解；没有气球则重心为原点，"全留空"是唯一解（取 L→0 极限判定目标是否在容差内）
    if (totalBalloons > n) return done([], false, 0);
    if (totalBalloons === 0) {
      const ok =
        Math.abs(g.targetX) <= g.maxDeviation * halfX + EPS && Math.abs(g.targetY) <= g.maxDeviation * halfY + EPS;
      return done(ok ? [new Array(n).fill(0) as BalloonPlacement] : [], false, 0);
    }

    // 所有气球必须放置 → 总浮力固定，平衡条件是力矩落入固定区间：
    // |Σ(l·x) − targetX·L| ≤ maxDev·halfX·L
    const xLo = g.targetX * totalLift - g.maxDeviation * halfX * totalLift - EPS;
    const xHi = g.targetX * totalLift + g.maxDeviation * halfX * totalLift + EPS;
    const yLo = g.targetY * totalLift - g.maxDeviation * halfY * totalLift - EPS;
    const yHi = g.targetY * totalLift + g.maxDeviation * halfY * totalLift + EPS;

    // 按影响力（|x|+|y|）降序决策，先定大力矩格
    const order = spots
      .map((_, i) => i)
      .sort((a, b) => {
        const sa = Math.abs(spots[a].x) + Math.abs(spots[a].y);
        const sb = Math.abs(spots[b].x) + Math.abs(spots[b].y);
        return sb - sa;
      });
    const xs = order.map((i) => spots[i].x);
    const ys = order.map((i) => spots[i].y);

    // 每个后缀的坐标排序副本，用于力矩上下界剪枝
    const suffixXsAsc: number[][] = [];
    const suffixYsAsc: number[][] = [];
    for (let d = 0; d <= n; d++) {
      suffixXsAsc.push(xs.slice(d).sort((a, b) => a - b));
      suffixYsAsc.push(ys.slice(d).sort((a, b) => a - b));
    }

    // 剩余浮力降序数组（随 DFS 增删，保持降序）
    const liftsPool: number[] = [];
    for (const t of LIFTS_DESC) for (let i = 0; i < counts[t]; i++) liftsPool.push(t);

    /**
     * 剩余 k 只气球放进后缀格子里，可达 Σ(l·coord) 的最大值：
     * 取坐标最大的 k 格，大浮力配大坐标（排序不等式）。最小值对称。
     */
    const bounds = (sortedAsc: number[], pool: number[]): [number, number] => {
      const k = pool.length;
      const m = sortedAsc.length;
      let max = 0;
      let min = 0;
      for (let i = 0; i < k; i++) {
        max += pool[i] * sortedAsc[m - 1 - i];
        min += pool[i] * sortedAsc[i];
      }
      return [min, max];
    };

    const placementSorted = new Array<number>(n).fill(0);
    const solutions: BalloonPlacement[] = [];
    let nodes = 0;
    let truncated = false;

    const emit = () => {
      const placement = new Array<BalloonLift | 0>(n).fill(0);
      for (let d = 0; d < n; d++) placement[order[d]] = placementSorted[d] as BalloonLift | 0;
      solutions.push(placement);
    };

    const removeFromPool = (lift: number) => {
      liftsPool.splice(liftsPool.indexOf(lift), 1);
    };
    const addToPool = (lift: number) => {
      let i = 0;
      while (i < liftsPool.length && liftsPool[i] >= lift) i++;
      liftsPool.splice(i, 0, lift);
    };

    const dfs = (d: number, tx: number, ty: number, remainingBalloons: number): boolean => {
      nodes++;
      if ((nodes & (PROGRESS_INTERVAL - 1)) === 0) options.onProgress?.(nodes, solutions.length);
      if (nodes >= maxNodes) {
        truncated = true;
        return true;
      }

      if (remainingBalloons === 0) {
        if (tx >= xLo && tx <= xHi && ty >= yLo && ty <= yHi) {
          // 达到上限后仍搜到新解才算截断：恰好等于上限且已穷尽时 truncated=false
          if (solutions.length >= maxSolutions) {
            truncated = true;
            return true;
          }
          // 剩余格子全部留空
          for (let i = d; i < n; i++) placementSorted[i] = 0;
          emit();
        }
        return false;
      }
      if (d >= n) return false;

      // 逐轴力矩可达界剪枝
      const [minX, maxX] = bounds(suffixXsAsc[d], liftsPool);
      if (tx + maxX < xLo || tx + minX > xHi) return false;
      const [minY, maxY] = bounds(suffixYsAsc[d], liftsPool);
      if (ty + maxY < yLo || ty + minY > yHi) return false;

      const spotX = xs[d];
      const spotY = ys[d];

      for (const lift of LIFTS_DESC) {
        if (counts[lift] === 0) continue;
        counts[lift]--;
        removeFromPool(lift);
        placementSorted[d] = lift;
        const stop = dfs(d + 1, tx + lift * spotX, ty + lift * spotY, remainingBalloons - 1);
        counts[lift]++;
        addToPool(lift);
        if (stop) return true;
      }

      // 留空（仅当剩余格数多于剩余气球数）
      if (n - d > remainingBalloons) {
        placementSorted[d] = 0;
        if (dfs(d + 1, tx, ty, remainingBalloons)) return true;
      }
      return false;
    };

    dfs(0, 0, 0, totalBalloons);
    return done(solutions, truncated, nodes);
  }

  // endregion
}
