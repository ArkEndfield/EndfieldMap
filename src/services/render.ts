import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
  RegularShape,
} from 'ol/style';

import { rafTimeout } from '@/utils/animationTimer';
import { debounce, xyz2crd } from '@/utils/common';
import { entityInfo } from '@/data/entity';
import { PointData } from '@/types/points';
import settings from '@/data/settings';
import {
  calculateOptimalScale,
  getColorForEntity,
  getImageSize,
} from '@/utils/render';

// 样式缓存类型
interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

let isCluster = true;

// 这些变量从data/entity.ts中提取
export const features: Feature<Point>[] = [];
export const itemMap: Record<number, Feature<Point>> = {};
export const entityGroup: Record<
  string,
  {
    name: string;
    points: Feature<Point>[];
  }
> = {};

// 源数据管理
export const source = new WebGLVectorLayer({
  source: new VectorSource<Feature<Point>>({
    features: [],
  }),
  style: {
    'circle-radius': 6,
    'circle-fill-color': '#3399CC',
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
});

// 样式缓存和图层容器
export const styleCache: { [key: string]: StyleCacheEntry } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

// 样式创建函数缓存
const iconStyleCache: { [key: string]: Promise<Style[] | Style> | undefined } =
  {};

// 样式创建函数
async function createCircleIconStyle(entityType: string, size: number = 1) {
  // 使用缓存键，避免重复创建相同样式
  const cacheKey = `${entityType}-${size}`;

  // 如果已经有缓存的样式创建请求，直接返回它
  if (iconStyleCache[cacheKey] !== undefined) {
    return iconStyleCache[cacheKey];
  }

  // 创建新的样式创建请求
  const stylePromise = (async () => {
    const color = getColorForEntity(entityType);
    const radius = 15;

    // 计算图标的目标尺寸（与圆形直径相同）
    const targetIconSize = radius * 2; // 图标尺寸等于圆形直径

    // 获取图片路径
    const imagePath = `/assets/${
      entityInfo[entityType]?.category || 'default'
    }/${entityInfo[entityType]?.entityInfo.pic || 'default'}.png`;

    // 获取图片尺寸
    const imageSize = await getImageSize(imagePath);

    // 计算最佳缩放比例
    const optimalScale = calculateOptimalScale(
      imageSize.width,
      imageSize.height,
      targetIconSize
    );

    // 创建统一的样式
    const baseStyles = [
      // 圆形外部描边 - 与背景色相同
      new Style({
        image: new CircleStyle({
          radius: radius + 2, // 外圈描边略大
          fill: new Fill({
            color: 'transparent', // 透明填充
          }),
          stroke: new Stroke({
            color: color, // 与背景同色
            width: 2, // 与内部描边相同的宽度
          }),
        }),
      }),
      // 圆形背景
      new Style({
        image: new CircleStyle({
          radius: radius,
          fill: new Fill({
            color: '#525152',
          }),
          stroke: new Stroke({
            color: '#2E2F2E',
            width: 2.5, // 增加描边宽度
          }),
        }),
      }),
      // 左侧尖头装饰
      new Style({
        image: new RegularShape({
          points: 3, // 三角形
          radius: radius * 0.35, // 减小三角形整体大小
          angle: 0.5 * Math.PI, // 起始角度
          fill: new Fill({
            color: '#2E2F2E', // 与描边同色
          }),
          displacement: [-radius + radius * 0.2, 0], // 位置左侧，稍微偏内一点
          rotation: 0, // 不旋转
        }),
      }),
      // 右侧尖头装饰
      new Style({
        image: new RegularShape({
          points: 3, // 三角形
          radius: radius * 0.35, // 减小三角形整体大小
          angle: -0.5 * Math.PI, // 旋转180度，使三角形朝左
          fill: new Fill({
            color: '#2E2F2E', // 与描边同色
          }),
          displacement: [radius - radius * 0.2, 0], // 位置右侧，稍微偏内一点
          rotation: 0, // 不旋转
        }),
      }),
      // 小图标居中，使用计算出的最佳缩放比例
      new Style({
        image: new Icon({
          src: imagePath,
          scale: optimalScale,
          // 图标居中于圆形
          anchor: [0.5, 0.5],
        }),
      }),
    ];

    // 如果是聚合点，添加数字标记
    if (size > 1) {
      baseStyles.push(
        new Style({
          // 给文字添加圆形背景
          image: new CircleStyle({
            radius: radius * 0.4, // 圆形背景的半径
            fill: new Fill({
              color: '#2E2F2E', // 背景色
            }),
            // 位置
            displacement: [0, -radius + 5], // 位置在圆形下方
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: '#fff',
            }),
            font: '8px "Noto Sans SC"',
            offsetY: radius - 5,
            stroke: new Stroke({
              color: '#000',
              width: 2,
            }),
          }),
        })
      );
    }

    // 在创建样式时添加动画效果
    const styles = baseStyles.map(style => {
      // 直接使用样式对象
      return style;
    });

    return styles;
  })();

  // 缓存样式创建请求
  iconStyleCache[cacheKey] = stylePromise;

  // 设置自动清理，避免缓存过大
  stylePromise.finally(() => {
    rafTimeout(() => {
      // 5分钟后清理此缓存项
      delete iconStyleCache[cacheKey];
    }, 300000);
  });

  return stylePromise;
}

// 初始化点位标记
export const marker = (entry: PointData) => {
  const info = entityInfo[entry.entityDataIdKey];
  if (!info) return;

  // 创建特征但不立即设置样式
  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });

  // 注册到实体组中
  if (!entityGroup[entry.entityDataIdKey]?.points?.length) {
    entityGroup[entry.entityDataIdKey] = {
      name: info.entityInfo.name,
      points: [feature],
    };
  } else {
    entityGroup[entry.entityDataIdKey].points.push(feature);
  }
  return feature;
};

// 按实体类型分组创建聚合源和图层
export const createEntityClusterLayers = () => {
  // 先清空现有的图层
  entityClusterLayers.length = 0;

  // 按实体类型分组
  const featuresByType: { [type: string]: Feature<Point>[] } = {};

  // 将所有特征按类型分组
  for (const feature of features) {
    const entityType = feature.get('payload')?.entityDataIdKey;
    if (!entityType) continue;

    // 处理当前地图中存在的实体类型，或者是自定义标点类型
    const isCustomType = ['custom', 'custom1', 'custom2'].includes(entityType);
    if (isCustomType || entityInfo[entityType]?.entityInfo.count > 0) {
      if (!featuresByType[entityType]) {
        featuresByType[entityType] = [];
      }
      featuresByType[entityType].push(feature);
    }
  }

  // 确保自定义标点类型总是有图层，即使还没有点位
  ['custom', 'custom1', 'custom2'].forEach(customType => {
    if (!featuresByType[customType] && entityInfo[customType]) {
      featuresByType[customType] = [];
    }
  });

  // 为每种类型创建单独的聚合源和图层
  for (const entityType in featuresByType) {
    // 创建源
    const typeSource = new VectorSource({
      features: featuresByType[entityType],
    });

    // 创建聚合源
    const clusterSource = new Cluster({
      distance: 20,
      source: typeSource,
    });

    // 保存聚合源以便后续更新
    entityClusterSources[entityType] = clusterSource;

    // 创建图层 - 确保默认不可见
    const layer = new VectorLayer({
      source: clusterSource,
      style: feature => {
        const size = feature.get('features')?.length;

        // 样式键
        const styleKey = `${entityType}-${size}`;

        // 如果缓存中没有样式
        if (!styleCache[styleKey]) {
          // 创建一个空样式，而不是默认样式
          styleCache[styleKey] = { style: new Style({}) };

          // 异步创建并更新最终样式
          createCircleIconStyle(entityType, size).then(finalStyle => {
            if (styleCache[styleKey]) {
              styleCache[styleKey].style = finalStyle;
              // 通知图层刷新
              layer.changed();
            }
          });
        }

        // 返回当前缓存的样式
        return styleCache[styleKey].style;
      },
      zIndex: 10,
      visible: false, // 默认设置为不可见
    });

    // 保存图层引用
    entityClusterLayers.push(layer);
  }

  return entityClusterLayers;
};

// 更新聚合距离的函数
export const updateClusterDistance = debounce(
  (zoom: number) => {
    // 获取当前聚合状态
    const shouldCluster = settings.value.isClusteringEnabled && zoom < 4;
    const newDistance = shouldCluster ? 30 : 0;

    // 检查是否需要更新聚合状态 - 比较当前第一个聚合源的距离
    const currentSources = Object.values(entityClusterSources);
    if (currentSources.length > 0) {
      const currentDistance = currentSources[0].getDistance();

      // 只有当聚合状态发生变化时才更新
      if (
        (shouldCluster && currentDistance === 0) ||
        (!shouldCluster && currentDistance > 0) ||
        isCluster !== shouldCluster
      ) {
        console.log(`聚合状态变化：${currentDistance} -> ${newDistance}`);
        isCluster = shouldCluster;

        // 直接设置所有聚合源的距离
        Object.values(entityClusterSources).forEach(source => {
          source.setDistance(newDistance);
        });
      }
    } else {
      // 如果尚未创建聚合源，直接返回
      console.log('聚合源尚未初始化，跳过更新');
    }
  },
  100,
  { leading: false, trailing: true }
);
