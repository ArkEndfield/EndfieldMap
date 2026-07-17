/** 浮力类型：游戏中气球的四种浮力值（BalloonBlockState 枚举值即浮力） */
export const BALLOON_LIFT_TYPES = [1, 2, 3, 6] as const;
export type BalloonLift = (typeof BALLOON_LIFT_TYPES)[number];

export interface BalloonSpot {
  x: number;
  y: number;
}

/** 库存：每种浮力的气球数量，对应关卡 JSON 的 balloonConfig */
export type BalloonCounts = Record<BalloonLift, number>;

export interface BalloonGravityConfig {
  targetX: number;
  targetY: number;
  /** 归一化重心每轴允许偏差，游戏正式关全为 0 */
  maxDeviation: number;
}

/** 官方答案条目（lift 已剥离 0x10 标志位） */
export interface BalloonAnswerEntry extends BalloonSpot {
  lift: BalloonLift;
  /** 原始数据中带 0x10 标志位（疑似编辑器标记，不影响解语义） */
  flagged: boolean;
}

interface BalloonRawAnswerEntry {
  x: number;
  y: number;
  lift: number;
}

/** CDN 上 /minigame/balloon/<levelId>.json 的原始形态 */
export interface BalloonLevelData {
  levelId: string;
  levelTextId: string;
  propLevel: number;
  boardSizeX: number;
  boardSizeY: number;
  placeableSpots: BalloonSpot[];
  correctAnswer?: BalloonRawAnswerEntry[];
  balloonConfig: { lift1: number; lift2: number; lift3: number; lift6: number };
  gravityConfig: BalloonGravityConfig;
}

export interface ParsedBalloonLevel {
  levelId: string;
  propLevel: number;
  boardSizeX: number;
  boardSizeY: number;
  placeableSpots: BalloonSpot[];
  balloonConfig: BalloonCounts;
  gravityConfig: BalloonGravityConfig;
  correctAnswer: BalloonAnswerEntry[];
}

/** 一个解：与 placeableSpots 等长，每格放置的浮力（0 = 留空） */
export type BalloonPlacement = (BalloonLift | 0)[];

export interface BalloonSolveOptions {
  /** 最多收集的解数，超过则 truncated=true */
  maxSolutions?: number;
  /** DFS 节点预算，防大关卡爆时间 */
  maxNodes?: number;
  /** 每探索多少节点回调一次进度 */
  onProgress?: (nodes: number, solutions: number) => void;
}

export interface BalloonSolveResult {
  solutions: BalloonPlacement[];
  /** 解数/节点数达到上限，结果不完整 */
  truncated: boolean;
  nodes: number;
  elapsedMs: number;
}
