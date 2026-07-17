import type { BalloonLift, BalloonPlacement, ParsedBalloonLevel } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { useEffect, useRef } from 'react';

import { BALLOON_CELL_SIZE } from '@/const/balloon';

interface BalloonSolutionGridProps {
  placement: BalloonPlacement | null;
  levelData: ParsedBalloonLevel | null;
  getLiftColor: (lift: BalloonLift) => string;
  className?: string;
}

/**
 * 浮空回收吊盘 canvas 渲染：N×N 棋盘（中心为原点，x 右 y 上），
 * 可放置格亮底 + 锚点圆环，气球画成浮力配色的圆 + 数字。
 */
export const BalloonSolutionGrid = ({ placement, levelData, getLiftColor, className }: BalloonSolutionGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !levelData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = levelData.boardSizeX;
    const rows = levelData.boardSizeY;
    const halfX = Math.floor(cols / 2);
    const halfY = Math.floor(rows / 2);

    // 处理高 DPI
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (!displayWidth || !displayHeight) return;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const contentWidth = cols * BALLOON_CELL_SIZE;
    const contentHeight = rows * BALLOON_CELL_SIZE;

    // fit-to-container 缩放并居中
    const PADDING = 20;
    const availWidth = Math.max(0, displayWidth - PADDING);
    const availHeight = Math.max(0, displayHeight - PADDING);

    const scale = Math.min(availWidth / contentWidth, availHeight / contentHeight);

    const offsetX = (displayWidth - contentWidth * scale) / 2;
    const offsetY = (displayHeight - contentHeight * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 游戏坐标 → 网格：行 r=0 在顶部（y=+halfY），列 c=0 在左侧（x=−halfX）
    const spotIndexByCell = new Map<string, number>();
    levelData.placeableSpots.forEach((spot, index) => {
      spotIndexByCell.set(`${spot.x},${spot.y}`, index);
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c - halfX;
        const y = halfY - r;
        const px = c * BALLOON_CELL_SIZE;
        const py = r * BALLOON_CELL_SIZE;
        const spotIndex = spotIndexByCell.get(`${x},${y}`);

        // 底格
        ctx.fillStyle = spotIndex !== undefined ? '#2E2F2E' : '#212221';
        ctx.fillRect(px + 1, py + 1, BALLOON_CELL_SIZE - 2, BALLOON_CELL_SIZE - 2);

        const cx = px + BALLOON_CELL_SIZE / 2;
        const cy = py + BALLOON_CELL_SIZE / 2;

        // 中心格十字（原点标记）
        if (x === 0 && y === 0) {
          ctx.strokeStyle = '#3C3D3C';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy);
          ctx.lineTo(cx + 6, cy);
          ctx.moveTo(cx, cy - 6);
          ctx.lineTo(cx, cy + 6);
          ctx.stroke();
        }

        if (spotIndex === undefined) continue;

        const lift = placement?.[spotIndex] ?? 0;

        if (lift === 0) {
          // 空的可放置格：锚点圆环
          ctx.strokeStyle = '#4C4D4C';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }

        // 气球
        const color = getLiftColor(lift);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 浮力数字
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(String(lift), cx, cy);
        ctx.fillText(String(lift), cx, cy);
      }
    }
  }, [placement, levelData, getLiftColor]);

  return <canvas ref={canvasRef} className={cn('block w-full h-70', className)} />;
};
