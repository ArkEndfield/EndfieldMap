export enum BalloonStatus {
  Idle,
  Loading,
  LoadingError,
  LoadingSuccess,
  Solving,
  SolvingError,
  SolvingSuccess,
}

export const BALLOON_CELL_SIZE = 32;
/** 面板里最多收集的解数（多数关解很多，全量枚举无意义） */
export const BALLOON_MAX_SOLUTIONS = 500;
