/**
 * Delta Robot Puzzle - Level Data Loader
 * 关卡数据加载器：将远程 JSON 转换为 UI 可用的数据结构
 */

import type { Group, LevelData, ObstacleData, ParsedLevel, PieceLoader, PieceUI } from '@eftypes/delta_robot';

import { parsePieceShape } from '@/services/delta_robot/solver';

const COLOR_MAP: Record<string, string> = {
  Color1: '#B3FF00',
  Color2: '#3CAAFF',
  Color3: '#00FFD0',
  Color4: '#FFAF49',
};

const DEFAULT_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'];

/**
 * 调整二维数组大小
 */
function adjust2DArray(arr: number[][], size: number, subSize: number): void {
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
export async function parseLevelData(data: LevelData, loadPiece: PieceLoader): Promise<ParsedLevel> {
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

    const color = COLOR_MAP[key] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] || '#3CAAFF';
    groups.push({
      id: idx + 1,
      name: key,
      color: color,
    });
  });

  if (groups.length === 0) {
    groups.push({ id: 1, name: 'Default', color: DEFAULT_COLORS[0] || '#3CAAFF' });
  }

  // 3. 约束条件
  const rowConstraints: number[][] = [];
  const colConstraints: number[][] = [];

  // 行约束长度 = sizeY (行数)
  adjust2DArray(rowConstraints, sizeY, groups.length);
  // 列约束长度 = sizeX (列数)
  adjust2DArray(colConstraints, sizeX, groups.length);

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
        const shape = parsePieceShape(pData.originBlocks);

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
