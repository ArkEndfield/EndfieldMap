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
let pulseAnimationFrameId: number | null = null;
const animationDuration = 200; // ms
const pulseDuration = 1500; // ms

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
  stopAllAnimations();

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
 * 停止所有动画
 */
const stopAllAnimations = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (pulseAnimationFrameId) {
    cancelAnimationFrame(pulseAnimationFrameId);
    pulseAnimationFrameId = null;
  }
};

/**
 * 显示标点选中指示器 (圆形扩展动画)
 * @param pointId 选中的点位ID
 * @param color 指示器颜色，默认为 'rgba(253, 251, 84, 0.8)'
 * @param radius 指示器最终半径（像素），默认为 15
 * @param strokeWidth 指示器边框宽度，默认为 3
 * @param pulseRingsCount 脉冲环数量，默认为 2
 * @param maxPulseScale 脉冲最大缩放比例，默认为 2.0
 */
export const showSelectionIndicator = (
  pointId: number | string,
  color: string = 'rgba(253, 251, 84, 0.8)',
  radius: number = 15,
  strokeWidth: number = 3,
  pulseRingsCount: number = 2,
  maxPulseScale: number = 2.0
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

  // 创建主指示器 Feature (一个空心圆)
  const mainFeature = new Feature({
    geometry: new Point(coordinates),
  });

  // 创建脉冲环 Features
  const pulseRingFeatures: Feature[] = [];
  for (let i = 0; i < pulseRingsCount; i++) {
    const pulseFeature = new Feature({
      geometry: new Point(coordinates),
    });
    pulseRingFeatures.push(pulseFeature);
    indicatorSource.addFeature(pulseFeature);
  }

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
  mainFeature.setStyle(initialStyle);

  // 初始化脉冲环为不可见
  pulseRingFeatures.forEach(feature => {
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 0,
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0)', // 完全透明
            width: 0,
          }),
          displacement: initialDisplacement,
        }),
      })
    );
  });

  // 添加主 Feature 到图层源
  indicatorSource.addFeature(mainFeature);

  // 启动初始展开动画
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
        fill: undefined, // 确保中间是空心的
        displacement: currentDisplacement,
      }),
    });

    // 应用样式
    mainFeature.setStyle(currentStyle);

    // 继续动画或结束
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;

      // 初始动画完成后，启动脉冲动画
      startPulseAnimation(
        finalRadius,
        strokeWidth,
        color,
        [0, targetDisplacementY],
        pulseRingFeatures,
        maxPulseScale
      );
    }
  };

  // 开始第一帧
  animationFrameId = requestAnimationFrame(animate);
};

/**
 * 启动脉冲/波纹动画效果
 */
const startPulseAnimation = (
  baseRadius: number,
  strokeWidth: number,
  baseColor: string,
  displacement: number[],
  pulseFeatures: Feature[],
  maxScale: number
) => {
  if (!pulseFeatures.length) return;

  const pulseCount = pulseFeatures.length;
  const pulseTotalDuration = pulseDuration;
  const pulseDelayPerRing = pulseTotalDuration / pulseCount;
  const startTimes = pulseFeatures.map(
    (_, i) => performance.now() + i * pulseDelayPerRing
  );

  const animatePulse = (currentTime: number) => {
    for (let i = 0; i < pulseCount; i++) {
      const elapsed = currentTime - startTimes[i];
      const ringProgress = (elapsed % pulseTotalDuration) / pulseTotalDuration;

      if (ringProgress >= 0) {
        // 计算当前尺寸和透明度
        const scale = 1 + (maxScale - 1) * ringProgress; // 从1倍大小到最大倍数
        const currentRadius = baseRadius * scale;

        // 透明度从0.7到0
        const alpha = Math.max(0, 0.7 * (1 - ringProgress));
        const currentColor = baseColor.replace(/[\d.]+\)$/, `${alpha})`);

        // 为每个脉冲环设置样式
        pulseFeatures[i].setStyle(
          new Style({
            image: new CircleStyle({
              radius: currentRadius,
              stroke: new Stroke({
                color: currentColor,
                width: Math.max(1, strokeWidth * (1 - ringProgress * 0.7)), // 线宽随进度减小
              }),
              fill: undefined, // 确保中间是空心的
              displacement: displacement,
            }),
          })
        );

        // 当一个环完成一个周期，重置其开始时间
        if (ringProgress >= 0.99) {
          startTimes[i] = currentTime;
        }
      }
    }

    // 继续动画循环
    pulseAnimationFrameId = requestAnimationFrame(animatePulse);
  };

  // 开始脉冲动画
  pulseAnimationFrameId = requestAnimationFrame(animatePulse);
};

/**
 * 清除选中指示器
 */
export const clearSelectionIndicator = (): void => {
  stopAllAnimations();

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
