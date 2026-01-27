export enum DeltaRobotStatus {
  Idle,
  Loading,
  LoadingError,
  LoadingSuccess,
  Solving,
  SolvingError,
  SolvingSuccess,
}

export const CELL_SIZE = 32;
export const GAP_BETWEEN_PIECES = 2; // 网格线缩进
export const STROKE_WIDTH = 1.5;
export const STROKE_GAP = 2; // 描边和填充之间的间隙
export const CORNER_RADIUS = 4;
export const INNER_CORNER_RADIUS = 8; // 填充的内角切角
export const STROKE_INNER_CORNER_RADIUS = 5; // 描边的内角切角
export const CHECKER_OPACITY = 0.15; // 为了可见性略微强于 0.1
