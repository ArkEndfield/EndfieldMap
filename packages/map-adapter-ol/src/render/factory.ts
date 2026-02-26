import Style from 'ol/style/Style';

export interface CornerGlowOptions {
  blur: number;
  color: string;
}

/**
 * 创建hover四个角的样式（替代原来的圆环）
 * 使用 custom renderer 直接在 canvas 上绘制，避免 SVG Data URL 每帧重新加载导致的闪烁
 * @param radius 当前半径（由动画控制器提供，表示中心到四角的距离）
 * @param baseRadius 底部圆的基础半径（不含描边）
 * @param strokeWidth 描边宽度
 * @param strokeColor 描边颜色
 * @param cornerLength 角线长度
 * @param glow 发光效果选项
 * @returns 样式
 */
export function createHoverCornerStyle(
  radius: number,
  baseRadius: number,
  strokeWidth: number = 2,
  strokeColor: string = 'rgba(255, 255, 255, 0.9)',
  cornerLength: number = 8,
  glow?: CornerGlowOptions,
): Style {
  const displacement = baseRadius + 3 * 2;

  return new Style({
    renderer: (pixelCoordinates, state) => {
      const { context, pixelRatio } = state;
      const [x, y] = pixelCoordinates as number[];

      const r = radius * pixelRatio;
      const cl = cornerLength * pixelRatio;
      const sw = strokeWidth * pixelRatio;
      const disp = displacement * pixelRatio;

      const centerY = y - disp;

      context.save();

      if (glow) {
        context.shadowBlur = glow.blur * pixelRatio;
        context.shadowColor = glow.color;
      }

      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = sw;
      context.lineCap = 'square';

      // 左上
      context.moveTo(x - r, centerY - r + cl);
      context.lineTo(x - r, centerY - r);
      context.lineTo(x - r + cl, centerY - r);

      // 右上
      context.moveTo(x + r - cl, centerY - r);
      context.lineTo(x + r, centerY - r);
      context.lineTo(x + r, centerY - r + cl);

      // 左下
      context.moveTo(x - r, centerY + r - cl);
      context.lineTo(x - r, centerY + r);
      context.lineTo(x - r + cl, centerY + r);

      // 右下
      context.moveTo(x + r - cl, centerY + r);
      context.lineTo(x + r, centerY + r);
      context.lineTo(x + r, centerY + r - cl);

      context.stroke();
      context.restore();
    },
  });
}
