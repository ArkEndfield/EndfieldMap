import Style from 'ol/style/Style';

/**
 * 创建hover四个角的样式（替代原来的圆环）
 * 使用 custom renderer 直接在 canvas 上绘制，避免 SVG Data URL 每帧重新加载导致的闪烁
 * @param radius 当前半径（由动画控制器提供，表示中心到四角的距离）
 * @param baseRadius 底部圆的基础半径（不含描边）
 * @param strokeWidth 描边宽度
 * @param strokeColor 描边颜色
 * @returns 样式
 */
export function createHoverCornerStyle(
  radius: number,
  baseRadius: number,
  strokeWidth: number = 2,
  strokeColor: string = 'rgba(255, 255, 255, 0.9)'
): Style {
  const displacement = baseRadius + 3 * 2;
  const cornerLength = 6; // 固定角长度

  return new Style({
    renderer: (pixelCoordinates, state) => {
      const { context, pixelRatio } = state;
      const [x, y] = pixelCoordinates as number[];

      // 应用像素比，确保在 Retina 屏等高分屏上尺寸正确
      const r = radius * pixelRatio;
      const cl = cornerLength * pixelRatio;
      const sw = strokeWidth * pixelRatio;
      const disp = displacement * pixelRatio;

      const centerY = y - disp;

      context.save();
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
