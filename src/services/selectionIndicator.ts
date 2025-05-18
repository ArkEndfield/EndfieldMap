import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke, Circle as CircleStyle } from 'ol/style';
import { Map } from 'ol';
import { getItemMap } from '@/services/render';

// 当前地图实例引用
let mapInstance: Map | null = null;

// 选中标记图层和源
let indicatorSource: VectorSource | null = null;
let indicatorLayer: VectorLayer<VectorSource> | null = null;

// 当前选中的点位ID
let currentSelectedPointId: number | string | null = null;

// 动画相关
let animationFrameId: number | null = null;
const animationDuration = 200; // ms

/**
 * 设置地图实例
 * @param map OpenLayers地图实例
 */
export const setMapForIndicator = (map: Map) => {
  mapInstance = map;
  initIndicatorLayer();
};

/**
 * 初始化指示器图层
 */
const initIndicatorLayer = () => {
  if (!mapInstance) return;

  // 如果已经存在则清理
  removeIndicatorLayer();

  // 创建指示器的源和图层
  indicatorSource = new VectorSource();
  indicatorLayer = new VectorLayer({
    source: indicatorSource,
    zIndex: 20,
  });

  // 添加到地图
  mapInstance.addLayer(indicatorLayer);
};

/**
 * 移除指示器图层
 */
const removeIndicatorLayer = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (indicatorLayer && mapInstance) {
    mapInstance.removeLayer(indicatorLayer);

    if (indicatorSource) {
      indicatorSource.clear();
    }

    indicatorLayer.setSource(null);
    indicatorSource = null;
    indicatorLayer = null;
    currentSelectedPointId = null;
  }
};

/**
 * 显示标点选中指示器 (圆形扩展动画)
 * @param pointId 选中的点位ID
 * @param color 指示器颜色，默认为 'rgba(253, 251, 84, 0.8)'
 * @param radius 指示器最终半径（像素），默认为 15
 * @param strokeWidth 指示器边框宽度，默认为 3
 */
export const showSelectionIndicator = (
  pointId: number | string,
  color: string = 'rgba(253, 251, 84, 0.8)',
  radius: number = 15,
  strokeWidth: number = 3
): void => {
  if (!mapInstance || !indicatorSource) {
    console.error('地图实例或指示器未初始化，无法显示选中指示器');
    return;
  }
  clearSelectionIndicator();

  const idAsString = pointId.toString(); // 确保使用字符串比较和查找

  const currentItemMap = getItemMap();

  // 查找对应的Feature
  const feature = currentItemMap[idAsString]; // 使用字符串 ID 查找
  if (!feature) {
    // 修改警告信息，使其更清晰
    console.warn(
      `[showSelectionIndicator] Feature not found in itemMap for ID: '${idAsString}'`
    );
    return;
  }

  // 获取点位坐标
  const geometry = feature.getGeometry();
  if (!geometry) {
    console.warn(`点位${idAsString}没有有效的几何信息`);
    return;
  }

  const coordinates = geometry.getCoordinates();
  if (!coordinates || coordinates.length < 2) {
    console.warn(`点位${idAsString}的坐标无效`);
    return;
  }

  // 设置当前选中的点位ID
  currentSelectedPointId = idAsString;

  // 创建指示器 Feature (一个点)
  const indicatorFeature = new Feature({
    geometry: new Point(coordinates),
  });

  // 定义初始和最终半径
  const initialRadius = 0;
  const finalRadius = radius;
  const finalDisplacementY = finalRadius + 6;
  const initialDisplacementY =
    finalDisplacementY + (initialRadius / 2) * (1 - 0);
  const initialDisplacement = [0, initialDisplacementY];
  // 创建初始样式 (半径为0)
  const initialStyle = new Style({
    image: new CircleStyle({
      radius: initialRadius,
      stroke: new Stroke({
        color: color,
        width: strokeWidth,
      }),
      displacement: initialDisplacement,
    }),
  });
  indicatorFeature.setStyle(initialStyle);

  // 添加 Feature 到图层源
  indicatorSource.addFeature(indicatorFeature);

  // 启动动画
  const startTime = performance.now();
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);

    // 计算当前半径，并确保不为负
    const calculatedRadius =
      initialRadius + (finalRadius - initialRadius) * progress;
    const currentRadius = Math.max(0, calculatedRadius);

    // 计算当前位移
    const targetDisplacementY = finalRadius + 6;
    const currentDisplacement = [
      0,
      targetDisplacementY + (currentRadius / 2) * (1 - progress),
    ];

    // 创建当前帧的样式
    const currentStyle = new Style({
      image: new CircleStyle({
        radius: currentRadius,
        stroke: new Stroke({
          color: color,
          width: strokeWidth,
        }),
        displacement: currentDisplacement,
      }),
    });

    // 应用样式
    indicatorFeature.setStyle(currentStyle);

    // 继续动画或结束
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
    }
  };

  // 开始第一帧
  animationFrameId = requestAnimationFrame(animate);
};

/**
 * 清除选中指示器
 */
export const clearSelectionIndicator = (): void => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (indicatorSource) {
    indicatorSource.clear();
    currentSelectedPointId = null;
  }
};

/**
 * 获取当前选中的点位ID
 * @returns 当前选中的点位ID或null
 */
export const getCurrentSelectedPointId = () => {
  return currentSelectedPointId;
};

/**
 * 在地图清理时调用，清理所有资源
 */
export const cleanupSelectionIndicator = (): void => {
  clearSelectionIndicator();
  removeIndicatorLayer();
  mapInstance = null;
};
