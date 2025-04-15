import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke } from 'ol/style';
import { Map } from 'ol';
import { itemMap } from '@/services/render';

// 当前地图实例引用
let mapInstance: Map | null = null;

// 选中标记图层和源
let indicatorSource: VectorSource | null = null;
let indicatorLayer: VectorLayer<VectorSource> | null = null;

// 当前选中的点位ID
let currentSelectedPointId: number | string | null = null;

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
    zIndex: 20, // 设置较高的zIndex确保在点位上方显示
  });

  // 添加到地图
  mapInstance.addLayer(indicatorLayer);
};

/**
 * 移除指示器图层
 */
const removeIndicatorLayer = () => {
  if (indicatorLayer && mapInstance) {
    mapInstance.removeLayer(indicatorLayer);

    if (indicatorSource) {
      indicatorSource.clear();
    }

    indicatorLayer.setSource(null);
    indicatorSource = null;
    indicatorLayer = null;
  }
};

/**
 * 显示标点选中指示器
 * @param pointId 选中的点位ID
 * @param color 指示器颜色，默认为黄色
 * @param size 指示器尺寸
 */
export const showSelectionIndicator = (
  pointId: number | string,
  color: string = 'rgba(253, 251, 84, 0.8)'
): void => {
  if (!mapInstance || !indicatorSource) {
    console.error('地图实例或指示器未初始化，无法显示选中指示器');
    return;
  } // 清除现有指示器
  clearSelectionIndicator();

  // 查找对应的Feature
  const feature = itemMap[pointId];
  if (!feature) {
    console.warn(`未找到ID为${pointId}的点位`);
    return;
  }

  // 获取点位坐标
  const geometry = feature.getGeometry();
  if (!geometry) {
    console.warn(`点位${pointId}没有有效的几何信息`);
    return;
  }

  const coordinates = geometry.getCoordinates();

  // 设置当前选中的点位ID
  currentSelectedPointId = pointId;

  // 创建四个角落线条
  createCornerLines(coordinates, color);
};

/**
 * 创建四个角落线条
 * @param coordinates 中心坐标
 * @param color 线条颜色
 * @param size 线条尺寸
 */
const createCornerLines = (coordinates: number[], color: string): void => {
  if (!indicatorSource || !mapInstance) return;

  const [x, y] = coordinates;

  // 线宽
  const lineWidth = 2;

  // 使用固定像素偏移创建线条
  // 这些是我们期望的像素偏移，而不是地图单位
  const pixelDistance = 20;
  const pixelLength = 12;

  // 创建不随缩放变化的线条样式
  const lineStyle = new Style({
    stroke: new Stroke({
      color: color,
      width: lineWidth,
    }),
    // 使用 imageSize 保持大小不变，始终以像素为单位渲染
  });

  // 创建一个更新线条位置的函数
  const updateIndicatorPosition = () => {
    if (!mapInstance || !indicatorSource) return;

    // 清除现有线条
    indicatorSource.clear();

    // 获取当前分辨率（用于将像素转换为地图单位）
    const resolution = mapInstance.getView().getResolution() || 1;

    // 将像素偏移转换为地图单位
    const mapDistance = pixelDistance * resolution;
    const mapLength = pixelLength * resolution;

    // 创建四个角落的线条
    // 左上角
    const topLeftH = new Feature({
      geometry: new LineString([
        [x - mapDistance, y - mapDistance],
        [x - mapDistance + mapLength, y - mapDistance],
      ]),
    });

    const topLeftV = new Feature({
      geometry: new LineString([
        [x - mapDistance, y - mapDistance],
        [x - mapDistance, y - mapDistance + mapLength],
      ]),
    });

    // 右上角
    const topRightH = new Feature({
      geometry: new LineString([
        [x + mapDistance, y - mapDistance],
        [x + mapDistance - mapLength, y - mapDistance],
      ]),
    });

    const topRightV = new Feature({
      geometry: new LineString([
        [x + mapDistance, y - mapDistance],
        [x + mapDistance, y - mapDistance + mapLength],
      ]),
    });

    // 左下角
    const bottomLeftH = new Feature({
      geometry: new LineString([
        [x - mapDistance, y + mapDistance],
        [x - mapDistance + mapLength, y + mapDistance],
      ]),
    });

    const bottomLeftV = new Feature({
      geometry: new LineString([
        [x - mapDistance, y + mapDistance],
        [x - mapDistance, y + mapDistance - mapLength],
      ]),
    });

    // 右下角
    const bottomRightH = new Feature({
      geometry: new LineString([
        [x + mapDistance, y + mapDistance],
        [x + mapDistance - mapLength, y + mapDistance],
      ]),
    });

    const bottomRightV = new Feature({
      geometry: new LineString([
        [x + mapDistance, y + mapDistance],
        [x + mapDistance, y + mapDistance - mapLength],
      ]),
    });

    // 设置样式
    [
      topLeftH,
      topLeftV,
      topRightH,
      topRightV,
      bottomLeftH,
      bottomLeftV,
      bottomRightH,
      bottomRightV,
    ].forEach(feature => {
      feature.setStyle(lineStyle);
    });

    // 添加到源
    indicatorSource.addFeatures([
      topLeftH,
      topLeftV,
      topRightH,
      topRightV,
      bottomLeftH,
      bottomLeftV,
      bottomRightH,
      bottomRightV,
    ]);
  };

  // 立即执行一次更新
  updateIndicatorPosition();

  // 添加视图分辨率变化的监听器，以便在缩放时更新线条位置
  const resolutionListener = () => {
    if (currentSelectedPointId !== null) {
      updateIndicatorPosition();
    }
  };

  // 移除可能存在的旧监听器
  mapInstance.getView().un('change:resolution', resolutionListener);

  // 添加新的监听器
  mapInstance.getView().on('change:resolution', resolutionListener);
};

/**
 * 清除选中指示器
 */
export const clearSelectionIndicator = (): void => {
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
