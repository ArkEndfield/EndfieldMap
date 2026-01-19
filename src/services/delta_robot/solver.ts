/**
 * Delta Robot Puzzle - Solver
 * 数织拼图求解器：使用回溯算法 + 实时约束剪枝
 */

import type { Coord, Grid, PieceShape, ObstacleData } from '../../data/delta_robot/types';

/**
 * 将坐标列表转换为 2D 矩阵形状
 */
export function parsePieceShape(coords: Coord[]): PieceShape {
  if (!coords || coords.length === 0) return [];

  // 1. 找到边界
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (const p of coords) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // 2. 归一化并填充矩阵
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const shape: PieceShape = Array.from({ length: height }, () => Array(width).fill(0));

  for (const p of coords) {
    const r = maxY - p.y;
    const c = p.x - minX;
    if (shape[r] && c >= 0 && c < width) {
      shape[r]![c] = 1;
    }
  }

  return shape;
}

/**
 * 裁剪拼图矩阵（移除空白边缘）
 */
function trimPiece(shape: PieceShape): PieceShape {
  if (shape.length === 0) return [];

  let minRow = shape.length,
    maxRow = -1;
  let minCol = Infinity,
    maxCol = -1;

  for (let r = 0; r < shape.length; r++) {
    const row = shape[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 1) {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }

  if (maxRow === -1 || minCol === Infinity) return [];

  const newShape: PieceShape = [];
  for (let r = minRow; r <= maxRow; r++) {
    const srcRow = shape[r];
    if (!srcRow) continue;
    const row: number[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      row.push(srcRow[c] ?? 0);
    }
    newShape.push(row);
  }
  return newShape;
}

/**
 * 90度顺时针旋转
 */
function rotate90(matrix: PieceShape): PieceShape {
  if (matrix.length === 0) return [];
  const rows = matrix.length;

  const cols = matrix.reduce((m, row) => Math.max(m, row?.length ?? 0), 0);
  if (cols === 0) return [];

  const newMatrix: PieceShape = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      newMatrix[c]![rows - 1 - r] = row[c] ?? 0;
    }
  }

  return trimPiece(newMatrix);
}

/**
 * 获取所有唯一的旋转变体（0°/90°/180°/270°）
 */
function getUniqueRotations(shape: PieceShape): PieceShape[] {
  const variants: PieceShape[] = [];
  const seen = new Set<string>();
  let current = shape;

  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(current);
    if (!seen.has(key)) {
      seen.add(key);
      variants.push(current);
    }
    current = rotate90(current);
  }
  return variants;
}

/**
 * 核心求解器
 * @param rows - 行数
 * @param cols - 列数
 * @param rowConstraints - 行约束
 * @param colConstraints - 列约束
 * @param pieces - 拼图形状数组
 * @param pieceGroupIds - 拼图所属分组 ID
 * @param numGroups - 分组总数
 * @param obstaclesMap - 障碍物二维数组
 * @returns 求解结果网格，失败返回 null
 */
export function solvePuzzle(
  rows: number,
  cols: number,
  rowConstraints: number[][],
  colConstraints: number[][],
  pieces: PieceShape[],
  pieceGroupIds: number[],
  numGroups: number,
  obstaclesMap: (ObstacleData | null)[][]
): Grid | null {
  // 1. 初始化网格与实时计数器
  const board: Grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const currentGroupArea = new Array(numGroups).fill(0);
  const rowCounts = Array.from({ length: rows }, () => new Array(numGroups).fill(0));
  const colCounts = Array.from({ length: cols }, () => new Array(numGroups).fill(0));

  // 1.1 处理障碍物并初始化计数
  for (let r = 0; r < rows; r++) {
    const obsRow = obstaclesMap[r];
    if (!obsRow) continue;
    for (let c = 0; c < cols; c++) {
      const obs = obsRow[c];
      if (!obs) continue;

      if (obs.type === 'uncounted') {
        board[r]![c] = -1;
      } else if (obs.type === 'counted') {
        board[r]![c] = 20000 + obs.groupId;
        if (obs.groupId >= 0 && obs.groupId < numGroups) {
          rowCounts[r]![obs.groupId] = (rowCounts[r]![obs.groupId] ?? 0) + 1;
          colCounts[c]![obs.groupId] = (colCounts[c]![obs.groupId] ?? 0) + 1;
          currentGroupArea[obs.groupId] = (currentGroupArea[obs.groupId] ?? 0) + 1;
        }
      }
    }
  }

  // 2. 面积与约束预校验
  const rowConstraintSums = new Array(numGroups).fill(0);
  const colConstraintSums = new Array(numGroups).fill(0);

  const safeRowConstraints = rowConstraints.map((row) => row.map((v) => Number(v ?? 0)));
  const safeColConstraints = colConstraints.map((col) => col.map((v) => Number(v ?? 0)));

  safeRowConstraints.forEach((row) =>
    row.forEach((val, gid) => {
      if (gid >= 0 && gid < numGroups)
        rowConstraintSums[gid] = (rowConstraintSums[gid] ?? 0) + val;
    })
  );
  safeColConstraints.forEach((col) =>
    col.forEach((val, gid) => {
      if (gid >= 0 && gid < numGroups)
        colConstraintSums[gid] = (colConstraintSums[gid] ?? 0) + val;
    })
  );

  // 统计拼图面积并预处理拼图对象
  interface SolverPiece {
    originalIndex: number;
    groupId: number;
    area: number;
    variants: PieceShape[];
  }

  const solverPieces: SolverPiece[] = [];

  pieces.forEach((p, idx) => {
    const area = p.flat().filter((x) => x === 1).length;
    const gid = pieceGroupIds[idx] ?? 0;

    if (gid >= 0 && gid < numGroups) {
      currentGroupArea[gid] = (currentGroupArea[gid] ?? 0) + area;
    }

    solverPieces.push({
      originalIndex: idx + 1, // 1-based index for board
      groupId: gid,
      area,
      variants: getUniqueRotations(p),
    });
  });

  // 校验面积一致性
  for (let g = 0; g < numGroups; g++) {
    if ((rowConstraintSums[g] ?? 0) !== (colConstraintSums[g] ?? 0)) {
      console.warn(
        `[Solver] Group ${g}: Row sum (${rowConstraintSums[g]}) != Col sum (${colConstraintSums[g]})`
      );
      return null;
    }
    if ((currentGroupArea[g] ?? 0) !== (rowConstraintSums[g] ?? 0)) {
      console.warn(
        `[Solver] Group ${g}: Pieces+Obs area (${currentGroupArea[g]}) != Constraints (${rowConstraintSums[g]})`
      );
      return null;
    }
  }

  // 3. 拼图排序（大块优先）
  solverPieces.sort((a, b) => b.area - a.area);

  // 4. 回溯搜索
  function backtrack(sortedIdx: number): boolean {
    if (sortedIdx === solverPieces.length) return true;

    const piece = solverPieces[sortedIdx]!;
    const gid = piece.groupId;

    if (gid < 0 || gid >= numGroups) return false;

    for (const currentShape of piece.variants) {
      const pHeight = currentShape.length;
      const pWidth = currentShape.reduce((m, row) => Math.max(m, row?.length ?? 0), 0);
      if (pHeight === 0 || pWidth === 0) continue;

      for (let r = 0; r <= rows - pHeight; r++) {
        for (let c = 0; c <= cols - pWidth; c++) {
          if (!canPlaceGeometry(board, currentShape, r, c)) continue;

          if (
            tryPlaceAndUpdate(
              board,
              rowCounts,
              colCounts,
              safeRowConstraints,
              safeColConstraints,
              currentShape,
              r,
              c,
              gid,
              piece.originalIndex
            )
          ) {
            if (backtrack(sortedIdx + 1)) return true;
            revertPlace(board, rowCounts, colCounts, currentShape, r, c, gid);
          }
        }
      }
    }
    return false;
  }

  return backtrack(0) ? board : null;
}

// --- 辅助函数 ---

/**
 * 检查是否可以在指定位置放置拼图（仅几何重叠检测）
 */
function canPlaceGeometry(
  board: Grid,
  piece: PieceShape,
  startRow: number,
  startCol: number
): boolean {
  for (let i = 0; i < piece.length; i++) {
    const prow = piece[i];
    if (!prow) continue;
    for (let j = 0; j < prow.length; j++) {
      if (prow[j] === 1) {
        if (board[startRow + i]?.[startCol + j] !== 0) return false;
      }
    }
  }
  return true;
}

/**
 * 尝试放置拼图并更新计数，立即检查约束
 */
function tryPlaceAndUpdate(
  board: Grid,
  rowCounts: number[][],
  colCounts: number[][],
  rowTargets: number[][],
  colTargets: number[][],
  piece: PieceShape,
  startRow: number,
  startCol: number,
  gid: number,
  mark: number
): boolean {
  if (gid < 0) return false;

  let success = true;

  outerLoop: for (let i = 0; i < piece.length; i++) {
    const prow = piece[i];
    if (!prow) continue;

    for (let j = 0; j < prow.length; j++) {
      if (prow[j] !== 1) continue;

      const r = startRow + i;
      const c = startCol + j;

      const boardRow = board[r];
      if (!boardRow) {
        success = false;
        break outerLoop;
      }

      // 更新棋盘
      boardRow[c] = mark;

      // 更新行计数
      const rcRow = rowCounts[r];
      const rtRow = rowTargets[r];
      const rowTarget = rtRow?.[gid] ?? 0;
      if (!rcRow) {
        success = false;
        boardRow[c] = 0;
        break outerLoop;
      }

      rcRow[gid] = (rcRow[gid] ?? 0) + 1;
      if ((rcRow[gid] ?? 0) > rowTarget) {
        success = false;
        rcRow[gid] = (rcRow[gid] ?? 0) - 1;
        boardRow[c] = 0;
        break outerLoop;
      }

      // 更新列计数
      const ccCol = colCounts[c];
      const ctCol = colTargets[c];
      const colTarget = ctCol?.[gid] ?? 0;
      if (!ccCol) {
        success = false;
        rcRow[gid] = (rcRow[gid] ?? 0) - 1;
        boardRow[c] = 0;
        break outerLoop;
      }

      ccCol[gid] = (ccCol[gid] ?? 0) + 1;
      if ((ccCol[gid] ?? 0) > colTarget) {
        success = false;
        rcRow[gid] = (rcRow[gid] ?? 0) - 1;
        ccCol[gid] = (ccCol[gid] ?? 0) - 1;
        boardRow[c] = 0;
        break outerLoop;
      }
    }
  }

  if (!success) {
    // 回滚已放置的格子
    for (let i = 0; i < piece.length; i++) {
      const prow = piece[i];
      if (!prow) continue;

      for (let j = 0; j < prow.length; j++) {
        if (prow[j] !== 1) continue;

        const r = startRow + i;
        const c = startCol + j;

        if (board[r]?.[c] === mark) {
          board[r]![c] = 0;
          const rcRow = rowCounts[r];
          const ccCol = colCounts[c];
          if (rcRow) rcRow[gid] = (rcRow[gid] ?? 0) - 1;
          if (ccCol) ccCol[gid] = (ccCol[gid] ?? 0) - 1;
        }
      }
    }
    return false;
  }

  return true;
}

/**
 * 回滚拼图放置
 */
function revertPlace(
  board: Grid,
  rowCounts: number[][],
  colCounts: number[][],
  piece: PieceShape,
  startRow: number,
  startCol: number,
  gid: number
): void {
  for (let i = 0; i < piece.length; i++) {
    const prow = piece[i];
    if (!prow) continue;

    for (let j = 0; j < prow.length; j++) {
      if (prow[j] !== 1) continue;

      const r = startRow + i;
      const c = startCol + j;

      if (board[r]) board[r]![c] = 0;
      if (rowCounts[r]) rowCounts[r]![gid] = (rowCounts[r]![gid] ?? 0) - 1;
      if (colCounts[c]) colCounts[c]![gid] = (colCounts[c]![gid] ?? 0) - 1;
    }
  }
}
