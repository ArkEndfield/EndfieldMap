import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import { Map } from 'ol';
import { generateUUID } from '@/utils/common';
import { getFeatures, getItemMap } from '@/services/render';
import Polygon from 'ol/geom/Polygon';

// 连线管理器
interface LineGroup {
  id: string;
  layer: VectorLayer<VectorSource>;
  source: VectorSource;
  pointIds: (number | string)[]; // 存储连接的点位ID
}

// 存储所有连线图层
export const lineGroups: Record<string, LineGroup> = {};

// 当前地图实例引用
let mapInstance: Map | null = null;

/**
 * 设置地图实例
 * @param map OpenLayers地图实例
 */
export const setMapForLines = (map: Map) => {
  mapInstance = map;
};

/**
 * 在多个标点之间创建连线
 * @param pointIds 点位ID数组
 * @param color 连线颜色，CSS颜色格式
 * @param width 连线宽度，默认2像素
 * @param dashed 是否使用虚线，默认为false
 * @returns 连线组的唯一ID，用于后续管理
 */
export const connectPoints = (
  pointIds: (number | string)[],
  color: string = '#FFFFFF',
  width: number = 2,
  dashed: boolean = false
): string => {
  if (!mapInstance) {
    console.error('地图实例未设置，无法创建连线');
    return '';
  }

  if (!pointIds || pointIds.length < 2) {
    console.error('至少需要两个点位才能创建连线');
    return '';
  }

  // 生成唯一ID
  const lineGroupId = generateUUID();

  // 创建线条样式
  const lineStyle = new Style({
    stroke: new Stroke({
      color,
      width,
      lineDash: dashed ? [4, 4] : undefined,
    }),
  });

  // 创建连线的源和图层
  const lineSource = new VectorSource();
  const lineLayer = new VectorLayer({
    source: lineSource,
    style: function (feature) {
      // 使用类型断言，确保 feature 是 Feature 类型
      const olFeature = feature as Feature;

      // 获取特征类型标记
      const featureType = olFeature.get('featureType');

      if (featureType === 'arrow') {
        // 返回箭头样式
        return olFeature.get('arrowStyle');
      } else {
        // 默认为线条样式
        return lineStyle;
      }
    },
    zIndex: 5, // 设置适当的zIndex，确保线条在点位下方但在地图上方
  });

  // 收集点位坐标
  const coordinates: number[][] = [];
  const validPointIds: (string | number)[] = [];

  // 对每个点位ID查找对应的Feature
  for (const pointId of pointIds) {
    if (pointId === null || pointId === undefined) {
      console.warn('尝试连接一个 null 或 undefined 的点位ID，已跳过');
      continue;
    }
    const feature = getItemMap()[pointId];
    if (feature) {
      const geometry = feature.getGeometry();
      if (geometry) {
        coordinates.push(geometry.getCoordinates());
        validPointIds.push(pointId);
      } else {
        console.warn(`点位 ${pointId} 没有有效的几何信息，已跳过`);
      }
    } else {
      console.warn(`未找到ID为 ${pointId} 的点位，已跳过`);
    }
  }

  // 如果有效点位不足两个，则放弃创建
  if (coordinates.length < 2) {
    console.error('有效的点位不足两个，无法创建连线');
    return '';
  }

  // 创建线条几何形状
  const lineFeature = new Feature({
    geometry: new LineString(coordinates),
  });

  // 标记为线条类型
  lineFeature.set('featureType', 'line');
  lineFeature.set('lineGroupId', lineGroupId);

  // 添加到源中
  lineSource.addFeature(lineFeature);

  // 添加方向箭头（如果至少有两个点）
  if (coordinates.length >= 2) {
    // 遍历连线的每个段
    for (let i = 0; i < coordinates.length - 1; i++) {
      // 计算箭头位置和方向
      const start = coordinates[i];
      const end = coordinates[i + 1];
      const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

      // 创建箭头几何形状
      const arrowSize = width * 0.5;

      // 箭头的三个点
      const arrowTip = [
        midPoint[0] + Math.cos(angle) * arrowSize,
        midPoint[1] + Math.sin(angle) * arrowSize,
      ];
      const arrowLeft = [
        midPoint[0] -
          (Math.cos(angle) * arrowSize) / 3 +
          (Math.cos(angle + Math.PI / 2) * arrowSize) / 3,
        midPoint[1] -
          (Math.sin(angle) * arrowSize) / 3 +
          (Math.sin(angle + Math.PI / 2) * arrowSize) / 3,
      ];
      const arrowRight = [
        midPoint[0] -
          (Math.cos(angle) * arrowSize) / 3 +
          (Math.cos(angle - Math.PI / 2) * arrowSize) / 3,
        midPoint[1] -
          (Math.sin(angle) * arrowSize) / 3 +
          (Math.sin(angle - Math.PI / 2) * arrowSize) / 3,
      ];

      // 创建三角形几何
      const arrowGeom = new Polygon([
        [arrowTip, arrowLeft, arrowRight, arrowTip],
      ]);

      // 创建箭头特征
      const arrowFeature = new Feature({
        geometry: arrowGeom,
      });

      // 标记为箭头类型
      arrowFeature.set('featureType', 'arrow');

      // 创建箭头样式
      const arrowStyle = new Style({
        fill: new Fill({
          color: color,
        }),
        stroke: new Stroke({
          color: color,
          width: 1,
        }),
      });

      // 存储箭头样式为特征属性
      arrowFeature.set('arrowStyle', arrowStyle);

      // 添加箭头特征到源
      lineSource.addFeature(arrowFeature);
    }
  }

  // 添加到地图
  mapInstance.addLayer(lineLayer);

  // 存储连线组信息
  lineGroups[lineGroupId] = {
    id: lineGroupId,
    layer: lineLayer,
    source: lineSource,
    pointIds: validPointIds,
  };

  return lineGroupId;
};

/**
 * 移除指定ID的连线组
 * @param lineGroupId 连线组ID
 * @returns 是否成功移除
 */
export const removeLineGroup = (lineGroupId: string): boolean => {
  if (!mapInstance) {
    console.error('地图实例未设置，无法移除连线');
    return false;
  }

  const lineGroup = lineGroups[lineGroupId];
  if (!lineGroup) {
    console.warn(`未找到ID为 ${lineGroupId} 的连线组`);
    return false;
  }

  // 从地图中移除图层
  mapInstance.removeLayer(lineGroup.layer);

  // 清除资源
  lineGroup.source.clear();
  lineGroup.layer.setSource(null);

  // 从管理器中删除
  delete lineGroups[lineGroupId];

  return true;
};

/**
 * 移除所有连线
 */
export const removeAllLines = (): void => {
  if (!mapInstance) {
    console.error('地图实例未设置，无法移除连线');
    return;
  }

  // 移除所有连线组
  Object.keys(lineGroups).forEach(lineGroupId => {
    const lineGroup = lineGroups[lineGroupId];

    // 从地图中移除图层
    mapInstance?.removeLayer(lineGroup.layer);

    // 清除资源
    lineGroup.source.clear();
    lineGroup.layer.setSource(null);
  });

  // 清空管理器
  Object.keys(lineGroups).forEach(key => delete lineGroups[key]);
};

/**
 * 获取所有连线组的信息
 * @returns 连线组信息数组
 */
export const getAllLineGroups = () => {
  return Object.entries(lineGroups).map(([id, group]) => ({
    id,
    pointIds: [...group.pointIds],
  }));
};

/**
 * 通过实体数据ID连接点位
 * @param entityIds 实体数据ID数组
 * @param color 连线颜色
 * @param width 线宽
 * @param dashed 是否虚线
 * @returns 连线组ID
 */
export const connectPointsByEntityId = (
  entityIds: string[],
  color: string = '#FFFFFF',
  width: number = 2,
  dashed: boolean = false
): string => {
  // 从features中找出对应entityDataIdKey的所有点位的levelLogicId
  const pointIds: number[] = [];

  for (const entityId of entityIds) {
    const matchedFeatures = getFeatures().filter(
      feature => feature.get('payload')?.entityDataIdKey === entityId
    );

    if (matchedFeatures.length > 0) {
      const pointId = matchedFeatures[0].get('payload')?.levelLogicId;
      if (pointId !== undefined) {
        pointIds.push(pointId);
      }
    }
  }

  if (pointIds.length < 2) {
    console.error('找到的有效点位不足两个，无法创建连线');
    return '';
  }

  return connectPoints(pointIds, color, width, dashed);
};
