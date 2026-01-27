import type { Grid, ParsedLevel } from '@eftypes/delta_robot';
import { useEffect, useRef } from 'react';

import { CELL_SIZE } from '@/const/delta_robot';
import { renderGroup, renderObstacle } from '@/services/delta_robot/render';
import { cn } from '@/utils/style';

interface DeltaRobotSolutionGridProps {
  solutionGrid: Grid | null;
  levelData: ParsedLevel | null;
  getGroupColor: (groupId: number) => string;
  className?: string;
}

export const DeltaRobotSolutionGrid = ({
  solutionGrid,
  levelData,
  getGroupColor,
  className,
}: DeltaRobotSolutionGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !solutionGrid || !levelData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flatGrid = solutionGrid.flat();
    const rows = solutionGrid.length;
    const cols = levelData.sizeX;

    // 处理高 DPI
    const dpr = window.devicePixelRatio || 1;

    // Get the display size from the canvas element (controlled by CSS)
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (!displayWidth || !displayHeight) return;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Clear with high DPI scaling reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Setup base scaling for DPI
    ctx.scale(dpr, dpr);

    const contentWidth = cols * CELL_SIZE;
    const contentHeight = rows * CELL_SIZE;

    // Calculate fit-to-container scale
    // Add some padding (e.g. 10px on each side -> 20px total)
    const PADDING = 20;
    const availWidth = Math.max(0, displayWidth - PADDING);
    const availHeight = Math.max(0, displayHeight - PADDING);

    const scaleX = availWidth / contentWidth;
    const scaleY = availHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY); // Scale to fit, but don't limit to 1 (allow zoom if needed, though usually it shrinks)

    // Center the content
    const offsetX = (displayWidth - contentWidth * scale) / 2;
    const offsetY = (displayHeight - contentHeight * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. 识别分组
    // 映射: pieceIndex (基于1的值) -> 单元格坐标列表
    const groups = new Map<number, { r: number; c: number }[]>();
    const obstacles: { r: number; c: number; val: number }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = flatGrid[r * cols + c];
        if (val > 0 && val < 20000) {
          // 拼图块
          if (!groups.has(val)) groups.set(val, []);
          groups.get(val)?.push({ r, c });
        } else if (val >= 20000) {
          // 障碍物 (计数的)
          obstacles.push({ r, c, val });
        } else if (val === -1) {
          // 障碍物 (不计数的)
          obstacles.push({ r, c, val });
        }
      }
    }

    // 2. 渲染分组
    groups.forEach((cells, val) => {
      // 查找颜色对应的 group ID
      const pieceData = levelData.pieces[val - 1];
      const color = pieceData ? getGroupColor(pieceData.groupId) : '#ccc';

      renderGroup(ctx, cells, color, val);
    });

    // 3. 渲染障碍物
    obstacles.forEach(({ r, c, val }) => {
      renderObstacle(ctx, r, c, val, getGroupColor);
    });
  }, [solutionGrid, levelData, getGroupColor]);

  return <canvas ref={canvasRef} className={cn('block w-full h-70', className)} />;
};
