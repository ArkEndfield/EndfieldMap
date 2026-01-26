import {
  CELL_SIZE,
  CHECKER_OPACITY,
  CORNER_RADIUS,
  GAP_BETWEEN_PIECES,
  INNER_CORNER_RADIUS,
  STROKE_GAP,
  STROKE_INNER_CORNER_RADIUS,
  STROKE_WIDTH,
} from '@/const/delta_robot';

function fillCornerTips(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  maxRadius: number,
  maxInnerRadius?: number
) {
  if (points.length === 0) return;
  const innerRadius = maxInnerRadius !== undefined ? maxInnerRadius : maxRadius;
  if (maxRadius <= 0 && innerRadius <= 0) return;

  const len = points.length;
  // 预计算边长
  const edgeLengths = points.map((p, i) => {
    const next = points[(i + 1) % len];
    return Math.sqrt(Math.pow(next.x - p.x, 2) + Math.pow(next.y - p.y, 2));
  });

  for (let i = 0; i < len; i++) {
    const p = points[i];
    const prev = points[(i - 1 + len) % len];
    const next = points[(i + 1) % len];

    // 判断凹凸性
    const dx1 = p.x - prev.x;
    const dy1 = p.y - prev.y;
    const dx2 = next.x - p.x;
    const dy2 = next.y - p.y;
    const cross = dx1 * dy2 - dx2 * dy1;
    const isInner = cross < -0.001;

    // 只填充外角 (Convex)
    if (!isInner) {
      const prevLen = edgeLengths[(i - 1 + len) % len];
      const currLen = edgeLengths[i];
      const r = Math.min(maxRadius, prevLen / 2, currLen / 2);

      if (r > 0) {
        // 计算切角点
        const vPrev = { x: prev.x - p.x, y: prev.y - p.y };
        const distPrev = Math.sqrt(vPrev.x * vPrev.x + vPrev.y * vPrev.y);
        const nPrev = { x: vPrev.x / distPrev, y: vPrev.y / distPrev };

        const vNext = { x: next.x - p.x, y: next.y - p.y };
        const distNext = Math.sqrt(vNext.x * vNext.x + vNext.y * vNext.y);
        const nNext = { x: vNext.x / distNext, y: vNext.y / distNext };

        const start = { x: p.x + nPrev.x * r, y: p.y + nPrev.y * r };
        const end = { x: p.x + nNext.x * r, y: p.y + nNext.y * r };

        // 绘制三角形 Start -> P -> End -> Close
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(p.x, p.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
      }
    }
  }
}

function drawChamferedPoly(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  maxRadius: number,
  maxInnerRadius?: number,
  drawCornerTips: boolean = false
) {
  if (points.length === 0) return;

  const innerRadius = maxInnerRadius !== undefined ? maxInnerRadius : maxRadius;

  // 如果半径 <= 0，简单多边形
  if (maxRadius <= 0 && innerRadius <= 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    return;
  }

  const len = points.length;
  // 预计算边长以安全地限制半径
  const edgeLengths = points.map((p, i) => {
    const next = points[(i + 1) % len];
    return Math.sqrt(Math.pow(next.x - p.x, 2) + Math.pow(next.y - p.y, 2));
  });

  // 从最后一段的中点开始
  const last = points[len - 1];
  const first = points[0];
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

  for (let i = 0; i < len; i++) {
    const p = points[i];
    const prev = points[(i - 1 + len) % len];
    const next = points[(i + 1) % len];

    // 判断凹凸性 (叉积)
    const dx1 = p.x - prev.x;
    const dy1 = p.y - prev.y;
    const dx2 = next.x - p.x;
    const dy2 = next.y - p.y;

    // 叉积 > 0 凸 (外角), < 0 凹 (内角) (假设顺时针)
    const cross = dx1 * dy2 - dx2 * dy1;
    const isInner = cross < -0.001;
    const targetRadius = isInner ? innerRadius : maxRadius;

    // 基于有效边长限制半径
    const prevLen = edgeLengths[(i - 1 + len) % len];
    const currLen = edgeLengths[i];

    const r = Math.min(targetRadius, prevLen / 2, currLen / 2);

    // 计算切角点
    const vPrev = { x: prev.x - p.x, y: prev.y - p.y };
    const distPrev = Math.sqrt(vPrev.x * vPrev.x + vPrev.y * vPrev.y);
    const nPrev = { x: vPrev.x / distPrev, y: vPrev.y / distPrev };

    const vNext = { x: next.x - p.x, y: next.y - p.y };
    const distNext = Math.sqrt(vNext.x * vNext.x + vNext.y * vNext.y);
    const nNext = { x: vNext.x / distNext, y: vNext.y / distNext };

    const start = {
      x: p.x + nPrev.x * r,
      y: p.y + nPrev.y * r,
    };

    const end = {
      x: p.x + nNext.x * r,
      y: p.y + nNext.y * r,
    };

    ctx.lineTo(start.x, start.y);

    // 如果是外角且启用 renderCornerTips，则绘制完整直角结构(三角)
    if (!isInner && drawCornerTips && r > 0) {
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, start.y);
      ctx.lineTo(end.x, end.y); // 继续路径
    } else {
      ctx.lineTo(end.x, end.y);
    }
  }

  ctx.closePath();
}

// 移除循环中的共线点
function simplifyLoop(points: { x: number; y: number }[]) {
  if (points.length < 3) return points;

  const newPoints: { x: number; y: number }[] = [];
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const prev = points[(i - 1 + len) % len];
    const curr = points[i];
    const next = points[(i + 1) % len];

    // 检查 curr 是否与 prev 和 next 共线
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // 叉积 check
    const cross = dx1 * dy2 - dx2 * dy1;
    const dot = dx1 * dx2 + dy1 * dy2;

    if (Math.abs(cross) < 0.001 && dot > 0) {
      continue;
    }
    newPoints.push(curr);
  }
  return newPoints;
}

// 内缩曼哈顿多边形
function insetPolygon(points: { x: number; y: number }[], amount: number) {
  const pixelPoints = points.map((p) => ({ x: p.x * CELL_SIZE, y: p.y * CELL_SIZE }));

  const newPoints: { x: number; y: number }[] = [];
  const len = pixelPoints.length;

  for (let i = 0; i < len; i++) {
    const curr = pixelPoints[i];
    const next = pixelPoints[(i + 1) % len];
    const prev = pixelPoints[(i - 1 + len) % len];

    const n1 = getInwardNormal(prev, curr);
    const n2 = getInwardNormal(curr, next);

    newPoints.push({
      x: curr.x + amount * (n1.x + n2.x),
      y: curr.y + amount * (n1.y + n2.y),
    });
  }

  return newPoints;
}

function getInwardNormal(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: -dy / len, y: dx / len };
}

export function renderObstacle(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  val: number,
  getGroupColor: (id: number) => string
) {
  const x = c * CELL_SIZE;
  const y = r * CELL_SIZE;

  ctx.fillStyle = '#1a1a1a';
  if (val >= 20000) {
    const groupId = val - 20000;
    ctx.fillStyle = getGroupColor(groupId);
  }

  // 障碍物形状：轻微内缩的正方形
  const inset = GAP_BETWEEN_PIECES;
  const rectX = x + inset;
  const rectY = y + inset;
  const rectSize = CELL_SIZE - 2 * inset;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rectX, rectY, rectSize, rectSize);
  ctx.clip();

  if (val === -1) {
    // 禁用方块：灰色斜线 (方向 /)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(rectX, rectY, rectSize, rectSize);

    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const size = rectSize;
    const space = 4; // 更密集的线条

    // 从左下到右上绘制斜线 (方向 /)
    // 线方程: y = -x + C
    for (let offset = -size; offset < size; offset += space) {
      ctx.moveTo(rectX + offset, rectY + size);
      ctx.lineTo(rectX + size + offset, rectY);
    }
    ctx.stroke();
  } else {
    // 锁或其他
    ctx.fillRect(rectX, rectY, rectSize, rectSize);

    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', x + CELL_SIZE / 2 + 1.5, y + CELL_SIZE / 2);
  }
  ctx.restore();
}

export function renderGroup(
  ctx: CanvasRenderingContext2D,
  cells: { r: number; c: number }[],
  color: string,
  labelVal: number
) {
  // 1. 构建边界边
  interface Point {
    x: number;
    y: number;
  }
  interface Edge {
    p1: Point;
    p2: Point;
  }

  const edges: Edge[] = [];
  const cellSet = new Set(cells.map((c) => `${c.r},${c.c}`));

  cells.forEach(({ r, c }) => {
    // 检查4个邻居。如果邻居不在组内，则添加边。
    // 确保绕行方向为顺时针 (CW)。

    // 上 (r-1, c): (x, y) -> (x+1, y)
    if (!cellSet.has(`${r - 1},${c}`)) {
      edges.push({ p1: { x: c, y: r }, p2: { x: c + 1, y: r } });
    }
    // 右 (r, c+1): (x+1, y) -> (x+1, y+1)
    if (!cellSet.has(`${r},${c + 1}`)) {
      edges.push({ p1: { x: c + 1, y: r }, p2: { x: c + 1, y: r + 1 } });
    }
    // 下 (r+1, c): (x+1, y+1) -> (x, y+1)
    if (!cellSet.has(`${r + 1},${c}`)) {
      edges.push({ p1: { x: c + 1, y: r + 1 }, p2: { x: c, y: r + 1 } });
    }
    // 左 (r, c-1): (x, y+1) -> (x, y)
    if (!cellSet.has(`${r},${c - 1}`)) {
      edges.push({ p1: { x: c, y: r + 1 }, p2: { x: c, y: r } });
    }
  });

  // 2. 将边链接成循环
  const loops: Point[][] = [];
  const edgeMap = new Map<string, Point>(); // key "x,y" (起点) -> Point (终点)

  edges.forEach((e) => {
    edgeMap.set(`${e.p1.x},${e.p1.y}`, e.p2);
  });

  while (edgeMap.size > 0) {
    const loop: Point[] = [];
    const firstKey = edgeMap.keys().next().value;
    if (!firstKey) break;

    const [startX, startY] = firstKey.split(',').map(Number);
    let startPoint: Point = { x: startX, y: startY };

    // 安全中断
    let limit = 1000;
    while (limit-- > 0) {
      loop.push(startPoint);
      const nextPoint = edgeMap.get(`${startPoint.x},${startPoint.y}`);
      if (!nextPoint) break;

      edgeMap.delete(`${startPoint.x},${startPoint.y}`);
      startPoint = nextPoint;

      if (Math.abs(startPoint.x - loop[0].x) < 0.001 && Math.abs(startPoint.y - loop[0].y) < 0.001) break;
    }
    loops.push(simplifyLoop(loop));
  }

  // 3. 绘制循环
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  loops.forEach((loop) => {
    // 3a. 生成描边的内缩多边形
    const strokePoly = insetPolygon(loop, GAP_BETWEEN_PIECES);

    // 3b. 生成填充的内缩多边形
    const fillPoly = insetPolygon(loop, GAP_BETWEEN_PIECES + STROKE_GAP + STROKE_WIDTH / 2);

    // 绘制填充
    ctx.fillStyle = color;
    ctx.beginPath();
    // 填充内角逻辑: 用户想要内角切角"更大" (更靠近描边).
    drawChamferedPoly(
      ctx,
      fillPoly,
      Math.max(0, CORNER_RADIUS - STROKE_GAP),
      Math.max(0, INNER_CORNER_RADIUS - STROKE_GAP)
    );
    ctx.fill();

    // 绘制棋盘格叠加层
    ctx.save();
    ctx.clip(); // 裁剪到填充区域
    ctx.fillStyle = `rgba(0,0,0,${CHECKER_OPACITY})`;
    cells.forEach(({ r, c }) => {
      // 棋盘格模式：每隔一个方块
      if ((r + c) % 2 === 1) {
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    });
    ctx.restore();

    // 绘制描边
    // 使用与方块相同的颜色作为描边

    // 1. 填充外角的尖端 (Tech Tips Fill)
    ctx.fillStyle = color;
    ctx.beginPath();
    fillCornerTips(ctx, strokePoly, CORNER_RADIUS, STROKE_INNER_CORNER_RADIUS);
    ctx.fill();

    // 2. 绘制描边轮廓
    ctx.strokeStyle = color;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.beginPath();
    drawChamferedPoly(ctx, strokePoly, CORNER_RADIUS, STROKE_INNER_CORNER_RADIUS, true);
    ctx.stroke();

    // 绘制文字数字
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 文字描边和填充
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    cells.forEach(({ r, c }) => {
      const x = (c + 0.5) * CELL_SIZE;
      const y = (r + 0.5) * CELL_SIZE;
      ctx.strokeText(String(labelVal), x, y);
      ctx.fillText(String(labelVal), x, y);
    });
  });
}
