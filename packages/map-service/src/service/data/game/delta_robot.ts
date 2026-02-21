import type {
  Coord,
  Grid,
  Group,
  LevelData,
  ObstacleData,
  ParsedLevel,
  PieceData,
  PieceLoader,
  PieceShape,
  PieceUI,
  SolverPiece,
} from '@endfieldmap/map-service/@types/delta_robot';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { DeltaRobotParsedLevelSchemaType } from '@endfieldmap/map-service/service/db/schema/game_data/delta_robot';
import { JSONLoader } from '@endfieldmap/tools';

export interface DeltaRobotConfig<T, R> {
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
  assetService: AssetService;
}

export class DeltaRobotService<T, R> {
  private jsonLoader: JSONLoader;
  private databaseService: DatabaseService<T, R>;
  private assetService: AssetService;

  public COLOR_MAP: Record<string, string> = {
    Color1: '#B3FF00',
    Color2: '#3CAAFF',
    Color3: '#00FFD0',
    Color4: '#FFAF49',
  };
  public DEFAULT_COLORS: string[] = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'];

  constructor(config: DeltaRobotConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
  }

  // region: data
  private async getParsedLevelFromDB(levelId: string) {
    return await this.databaseService.gameDatabase.gameDeltaRobotParsedLevel
      .findOne({
        selector: { levelId },
      })
      .exec();
  }

  /**
   * 获取关卡数据
   * @param levelId 关卡ID
   */
  public async getLevelData(levelId: string): Promise<ParsedLevel | null> {
    // 先从数据库查找缓存
    const cached = await this.getParsedLevelFromDB(levelId);
    if (cached) {
      const data = cached.toJSON();
      return {
        sizeX: data.sizeX,
        sizeY: data.sizeY,
        groups: data.groups as ParsedLevel['groups'],
        rowConstraints: data.rowConstraints as ParsedLevel['rowConstraints'],
        colConstraints: data.colConstraints as ParsedLevel['colConstraints'],
        obstaclesFlat: data.obstaclesFlat as ParsedLevel['obstaclesFlat'],
        pieces: data.pieces as ParsedLevel['pieces'],
      };
    }

    try {
      // 加载关卡数据
      const levelUrl = `${this.assetService.url.miniGameData}/delta_robot/${levelId}.json`;
      const levelData = await this.jsonLoader.loadJSON<LevelData>(levelUrl);

      // 拼图块加载器
      const pieceLoader = async (blockId: string) => {
        const pieceUrl = `${this.assetService.url.miniGameData}/delta_robot/${blockId}.json`;
        return this.jsonLoader.loadJSON<PieceData>(pieceUrl);
      };

      // 解析关卡数据
      const parsed = await this.parseLevelData(levelData, pieceLoader);

      // 保存到数据库
      await this.databaseService.gameDatabase.gameDeltaRobotParsedLevel.upsert({
        levelId,
        ...parsed,
      } as DeltaRobotParsedLevelSchemaType);

      return parsed;
    } catch (error) {
      console.error(`Failed to load level ${levelId}:`, error);
      return null;
    }
  }
  // endregion: data

  // region: loader

  /**
   * 调整二维数组大小
   * @param arr - 要调整的二维数组
   * @param size - 数组的大小
   * @param subSize - 子数组的大小
   */
  private adjust2DArray(arr: number[][], size: number, subSize: number) {
    while (arr.length < size) arr.push([]);
    while (arr.length > size) arr.pop();
    for (let i = 0; i < arr.length; i++) {
      while ((arr[i]?.length ?? 0) < subSize) arr[i]?.push(0);
      while ((arr[i]?.length ?? 0) > subSize) arr[i]?.pop();
    }
  }

  /**
   * 解析关卡数据
   * @param data - 从服务器加载的原始关卡数据
   * @param loadPiece - 拼图块加载器函数
   * @returns 解析后的关卡数据
   */
  public async parseLevelData(data: LevelData, loadPiece: PieceLoader): Promise<ParsedLevel> {
    // 1. 场景尺寸
    const sizeX = data.sizeX;
    const sizeY = data.sizeY || data.sizeX; // 默认正方形

    // 2. 颜色分组
    const groups: Group[] = [];
    const colorKeys = new Set([...Object.keys(data.rowCondition || {}), ...Object.keys(data.columnCondition || {})]);

    // 过滤并排序 Color 键
    const sortedKeys = Array.from(colorKeys)
      .filter((k) => k.startsWith('Color'))
      .sort();

    const keyToIdx = new Map<string, number>();
    const colorNumToIdx = new Map<number, number>();

    sortedKeys.forEach((key, idx) => {
      keyToIdx.set(key, idx);
      const match = key.match(/Color(\d+)/);
      if (match) {
        colorNumToIdx.set(parseInt(match[1] || ''), idx);
      }

      const color = this.COLOR_MAP[key] || this.DEFAULT_COLORS[idx % this.DEFAULT_COLORS.length] || '#3CAAFF';
      groups.push({
        id: idx + 1,
        name: key,
        color: color,
      });
    });

    if (groups.length === 0) {
      groups.push({ id: 1, name: 'Default', color: this.DEFAULT_COLORS[0] || '#3CAAFF' });
    }

    // 3. 约束条件
    const rowConstraints: number[][] = [];
    const colConstraints: number[][] = [];

    // 行约束长度 = sizeY (行数)
    this.adjust2DArray(rowConstraints, sizeY, groups.length);
    // 列约束长度 = sizeX (列数)
    this.adjust2DArray(colConstraints, sizeX, groups.length);

    // 填充行约束
    for (const [key, vals] of Object.entries(data.rowCondition || {})) {
      const gIdx = keyToIdx.get(key);
      if (gIdx !== undefined) {
        vals.forEach((val, rIdx) => {
          if (rowConstraints[rIdx]) {
            rowConstraints[rIdx][gIdx] = Number(val);
          }
        });
      }
    }

    // 填充列约束
    for (const [key, vals] of Object.entries(data.columnCondition || {})) {
      const gIdx = keyToIdx.get(key);
      if (gIdx !== undefined) {
        vals.forEach((val, cIdx) => {
          if (colConstraints[cIdx]) {
            colConstraints[cIdx][gIdx] = Number(val);
          }
        });
      }
    }

    // 4. 障碍物
    // 扁平化数组：size = width * height = sizeX * sizeY
    const obstaclesFlat: (ObstacleData | null)[] = new Array(sizeX * sizeY).fill(null);

    // 非计数障碍物
    if (data.bannedGrids) {
      data.bannedGrids.forEach((p) => {
        // 索引 = y * width + x
        const idx = p.y * sizeX + p.x;
        if (idx >= 0 && idx < obstaclesFlat.length) {
          obstaclesFlat[idx] = { type: 'uncounted', groupId: 0 };
        }
      });
    }

    // 计数障碍物
    if (data.preGrids) {
      for (const [key, coords] of Object.entries(data.preGrids)) {
        const gIdx = keyToIdx.get(key);
        if (gIdx !== undefined) {
          coords.forEach((p) => {
            const idx = p.y * sizeX + p.x;
            if (idx >= 0 && idx < obstaclesFlat.length) {
              obstaclesFlat[idx] = { type: 'counted', groupId: gIdx };
            }
          });
        }
      }
    }

    // 5. 拼图块
    const pieces: PieceUI[] = [];
    if (data.attachBlocks) {
      for (const block of data.attachBlocks) {
        try {
          const pData = await loadPiece(block.blockID);
          const shape = this.parsePieceShape(pData.originBlocks);

          let targetGroupIdx = colorNumToIdx.get(block.color);
          if (targetGroupIdx === undefined) targetGroupIdx = 0;

          // 根据数量复制多个实例
          for (let i = 0; i < block.number; i++) {
            pieces.push({
              id: `${block.blockID}_${i}_${Date.now()}_${Math.random()}`,
              shape: JSON.parse(JSON.stringify(shape)), // 深拷贝
              groupId: targetGroupIdx,
            });
          }
        } catch (e) {
          console.error(`Failed to load piece ${block.blockID}`, e);
          // 继续加载其他拼图块
        }
      }
    }

    return {
      sizeX,
      sizeY,
      groups,
      rowConstraints,
      colConstraints,
      obstaclesFlat,
      pieces,
    };
  }

  // endregion: loader

  // region: solver

  /**
   * 裁剪拼图矩阵（移除空白边缘）
   * @param shape - 拼图矩阵
   * @returns 裁剪后的拼图矩阵
   */
  private trimPiece(shape: PieceShape): PieceShape {
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
   * @param matrix - 矩阵
   * @returns 旋转后的矩阵
   */
  private rotate90(matrix: PieceShape): PieceShape {
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

    return this.trimPiece(newMatrix);
  }

  /**
   * 获取所有唯一的旋转变体（0°/90°/180°/270°）
   * @param shape - 拼图矩阵
   * @returns 所有唯一的旋转变体
   */
  private getUniqueRotations(shape: PieceShape): PieceShape[] {
    const variants: PieceShape[] = [];
    const seen = new Set<string>();
    let current = shape;

    for (let i = 0; i < 4; i++) {
      const key = JSON.stringify(current);
      if (!seen.has(key)) {
        seen.add(key);
        variants.push(current);
      }
      current = this.rotate90(current);
    }
    return variants;
  }

  /**
   * 检查是否可以在指定位置放置拼图（仅几何重叠检测）
   * @param board - 拼图矩阵
   * @param piece - 拼图形状
   * @param startRow - 起始行
   * @param startCol - 起始列
   * @returns 是否可以放置
   */
  private canPlaceGeometry(board: Grid, piece: PieceShape, startRow: number, startCol: number): boolean {
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
   * @param board - 拼图矩阵
   * @param rowCounts - 行计数
   * @param colCounts - 列计数
   * @param rowTargets - 行目标
   * @param colTargets - 列目标
   * @param piece - 拼图形状
   * @param startRow - 起始行
   * @param startCol - 起始列
   * @param gid - 拼图组ID
   * @param mark - 标记值
   * @returns 是否成功放置
   */
  private tryPlaceAndUpdate(
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
   * @param board - 拼图矩阵
   * @param rowCounts - 行计数
   * @param colCounts - 列计数
   * @param piece - 拼图形状
   * @param startRow - 起始行
   * @param startCol - 起始列
   * @param gid - 拼图组ID
   */
  private revertPlace(
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

  /**
   * 将坐标列表转换为 2D 矩阵形状
   * @param coords - 坐标列表
   * @returns 2D 矩阵形状
   */
  private parsePieceShape(coords: Coord[]): PieceShape {
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
  public solvePuzzle(
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
        if (gid >= 0 && gid < numGroups) rowConstraintSums[gid] = (rowConstraintSums[gid] ?? 0) + val;
      })
    );
    safeColConstraints.forEach((col) =>
      col.forEach((val, gid) => {
        if (gid >= 0 && gid < numGroups) colConstraintSums[gid] = (colConstraintSums[gid] ?? 0) + val;
      })
    );

    // 统计拼图面积并预处理拼图对象
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
        variants: this.getUniqueRotations(p),
      });
    });

    // 校验面积一致性
    for (let g = 0; g < numGroups; g++) {
      if ((rowConstraintSums[g] ?? 0) !== (colConstraintSums[g] ?? 0)) {
        console.warn(`[Solver] Group ${g}: Row sum (${rowConstraintSums[g]}) != Col sum (${colConstraintSums[g]})`);
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
    return this.solveBacktrack(
      0,
      solverPieces,
      numGroups,
      rows,
      cols,
      board,
      rowCounts,
      colCounts,
      safeRowConstraints,
      safeColConstraints
    )
      ? board
      : null;
  }

  /**
   * 回溯求解
   */
  private solveBacktrack(
    sortedIdx: number,
    solverPieces: SolverPiece[],
    numGroups: number,
    rows: number,
    cols: number,
    board: Grid,
    rowCounts: number[][],
    colCounts: number[][],
    rowConstraints: number[][],
    colConstraints: number[][]
  ): boolean {
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
          if (!this.canPlaceGeometry(board, currentShape, r, c)) continue;

          if (
            this.tryPlaceAndUpdate(
              board,
              rowCounts,
              colCounts,
              rowConstraints,
              colConstraints,
              currentShape,
              r,
              c,
              gid,
              piece.originalIndex
            )
          ) {
            if (
              this.solveBacktrack(
                sortedIdx + 1,
                solverPieces,
                numGroups,
                rows,
                cols,
                board,
                rowCounts,
                colCounts,
                rowConstraints,
                colConstraints
              )
            )
              return true;
            this.revertPlace(board, rowCounts, colCounts, currentShape, r, c, gid);
          }
        }
      }
    }
    return false;
  }

  // endregion: solver
}
