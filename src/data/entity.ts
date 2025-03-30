import { xyz2crd } from '@/utils/common';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { computed, reactive, watch } from 'vue';
import Cluster from 'ol/source/Cluster';
import VectorLayer from 'ol/layer/Vector';
import { PointData, points } from './points';
import {
  currentMarkFilter,
  shouldShowByMarkStatus,
  onMarkChange,
} from './marks';
import entityData from '../assets/entity.json';

interface EntityInfo {
  name: string;
  point: string;
  pic: string;
  show: boolean;
  count: number;
  scale?: number;
}

type EntityCategory =
  | 'ether' // 醚质
  | 'chest' // 宝箱
  | 'mineral' // 矿物
  | 'enemy' // 敌人
  | 'settlement' // 定居点
  | 'spcstone' // 稀有矿物
  | 'special' // 特殊点位
  | 'plant' // 植物类素材
  | 'dungeon'; // 副本点位

type EntityCategories = Record<
  string,
  {
    category: EntityCategory;
    entityInfo: EntityInfo;
  }
>;

export const entityInfo: EntityCategories = reactive(
  entityData as EntityCategories
);

export const categoryInfo = computed(() => {
  const categories: Record<string, EntityInfo[]> = {};
  for (const key in entityInfo) {
    const entity = entityInfo[key];
    const category = entity.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(entity.entityInfo);
  }
  return categories;
});

const features: Feature<Point>[] = [];
const itemMap: any = {};
const entityGroup: Record<
  string,
  {
    name: string;
    points: Feature<Point>[];
  }
> = {};

// 添加一个全局变量来存储当前的缩放级别
let currentZoomLevel = 3;

// 简化的圆形半径获取函数，在较小缩放级别时使用更大的半径
export const getCircleRadiusForZoom = (baseRadius: number = 20): number => {
  // 根据缩放级别调整圆形半径，较小缩放级别使用较大半径
  const zoomRadiusFactor = {
    1: 1, // 最小缩放级别使用较大半径
    2: 1.0,
    3: 1.0,
    4: 1.1,
    5: 1.3, // 最大缩放级别使用较小半径
  };

  const radiusFactor = zoomRadiusFactor[Math.round(currentZoomLevel)] || 1.0;
  return baseRadius * radiusFactor;
};

// 更新当前缩放级别的函数
export const updateCurrentZoom = (zoom: number) => {
  currentZoomLevel = zoom;
  refreshStyles();
};

// 为实体类型获取颜色
function getColorForEntity(entityType: string): string {
  const colorMap: { [key: string]: string } = {
    // 宝箱 - 橙色
    int_trchest_common: 'rgba(255, 153, 0, 0.8)',
    int_trchest_common_normal: 'rgba(255, 153, 0, 0.8)',
    int_trchest_common_high: 'rgba(255, 153, 0, 0.8)',
    int_trchest_lock: 'rgba(255, 153, 0, 0.8)',

    // 醚质 - 黄色
    int_collection_coin: 'rgba(255, 235, 59, 0.8)',
    int_collection_coin_puzzle: 'rgba(255, 235, 59, 0.8)',

    // 特殊点位 - 蓝色
    int_campfire_v2: 'rgba(33, 150, 243, 0.8)',
    int_blackbox_entry: 'rgba(156, 39, 176, 0.8)',
    int_blackbox_entry_hard: 'rgba(156, 39, 176, 0.8)',
    int_doodad_core_recycle: 'rgba(33, 150, 243, 0.8)',

    // 副本 - 红色
    int_dungeon_entry_bossrush: 'rgba(183, 28, 28, 0.8)',
    int_dungeon_entry_challenge: 'rgba(183, 28, 28, 0.8)',
    int_dungeon_entry_hard: 'rgba(183, 28, 28, 0.8)',
    int_dungeon_entry_resource: 'rgba(183, 28, 28, 0.8)',

    // 矿物 - 棕色
    int_doodad_core_mine_copper: 'rgba(121, 85, 72, 0.8)',
    int_doodad_core_mine_iron: 'rgba(121, 85, 72, 0.8)',
    int_doodad_core_mine_originum: 'rgba(121, 85, 72, 0.8)',
    int_doodad_core_mine_quartz: 'rgba(121, 85, 72, 0.8)',

    // 植物 - 绿色
    int_doodad_core_crylplant_1_1: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_crylplant_1_2: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_crylplant_1_3: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_crylplant_2_1: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_mushroom_1_1: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_mushroom_1_2: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_mushroom_1_3: 'rgba(76, 175, 80, 0.8)',
    int_doodad_core_mushroom_2_1: 'rgba(76, 175, 80, 0.8)',

    // 稀有矿物 - 紫色
    int_doodad_core_spcstone_1_1: 'rgba(103, 58, 183, 0.8)',
    int_doodad_core_spcstone_1_2: 'rgba(103, 58, 183, 0.8)',
    int_doodad_core_spcstone_1_3: 'rgba(103, 58, 183, 0.8)',
    int_doodad_core_spcstone_2_1: 'rgba(103, 58, 183, 0.8)',

    // 定居点 - 深蓝色
    stm_hongs_1: 'rgba(25, 118, 210, 0.8)',
    stm_tundra_1: 'rgba(25, 118, 210, 0.8)',
    stm_tundra_2: 'rgba(25, 118, 210, 0.8)',
    stm_tundra_3: 'rgba(25, 118, 210, 0.8)',

    // 敌人 - 红色
    eny_0045_agtrinit: 'rgba(211, 47, 47, 0.8)',
  };

  return colorMap[entityType] || 'rgba(128, 128, 128, 0.8)';
}

// 添加一个用于缓存图片尺寸的对象
const imageSizeCache: { [key: string]: { width: number; height: number } } = {};
// 添加图片加载状态的缓存，避免重复加载同一图片
const imageLoadingPromises: {
  [key: string]: Promise<{ width: number; height: number }>;
} = {};

// 获取图片尺寸的函数 - 优化版本
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  // 如果已经有这个图片的加载Promise，直接返回它，避免重复加载
  if (src in imageLoadingPromises) {
    return imageLoadingPromises[src];
  }

  // 如果已经缓存了尺寸信息，直接返回
  if (imageSizeCache[src]) {
    return Promise.resolve(imageSizeCache[src]);
  }

  // 创建新的加载Promise并缓存它
  const loadPromise = new Promise<{ width: number; height: number }>(
    resolve => {
      const img = new Image();

      img.onload = () => {
        // 缓存尺寸信息并返回
        const size = { width: img.width, height: img.height };
        imageSizeCache[src] = size;
        // 加载完成后删除promise缓存
        delete imageLoadingPromises[src];
        resolve(size);
      };

      img.onerror = () => {
        // 加载失败时使用默认尺寸并记录警告
        console.warn(`无法加载图片: ${src}`);
        const defaultSize = { width: 32, height: 32 };
        // 缓存默认尺寸以避免再次尝试加载失败的图片
        imageSizeCache[src] = defaultSize;
        // 删除promise缓存
        delete imageLoadingPromises[src];
        resolve(defaultSize);
      };

      // 设置5秒超时
      setTimeout(() => {
        if (!imageSizeCache[src]) {
          console.warn(`图片加载超时: ${src}`);
          const defaultSize = { width: 32, height: 32 };
          imageSizeCache[src] = defaultSize;
          delete imageLoadingPromises[src];
          resolve(defaultSize);
        }
      }, 5000);

      img.src = src;
    }
  );

  // 缓存加载Promise
  imageLoadingPromises[src] = loadPromise;
  return loadPromise;
}

// 根据图片尺寸计算最适合的缩放比例
function calculateOptimalScale(
  imageWidth: number,
  imageHeight: number,
  targetSize: number
): number {
  // 取图片的最大边长
  const maxDimension = Math.max(imageWidth, imageHeight);
  // 计算需要的缩放比例，使最大边长适应目标尺寸
  return targetSize / maxDimension;
}

// 修改创建样式的函数，加入图片尺寸自适应
async function createCircleIconStyle(entityType: string, size: number = 1) {
  const color = getColorForEntity(entityType);
  const baseRadius = 15;
  const radius = getCircleRadiusForZoom(baseRadius);

  // 计算图标的目标尺寸（圆形半径的比例）
  const targetIconSize = radius * 1.4; // 图标最大可占用圆形直径的70%

  // 获取图片路径
  const imagePath = `/assets/${entityInfo[entityType]?.category || 'default'}/${
    entityInfo[entityType]?.entityInfo.pic || 'default'
  }.png`;

  // 获取图片尺寸
  const imageSize = await getImageSize(imagePath);

  // 计算最佳缩放比例
  const optimalScale = calculateOptimalScale(
    imageSize.width,
    imageSize.height,
    targetIconSize
  );

  // 创建统一的样式
  let styles = [
    // 圆形背景
    new Style({
      image: new CircleStyle({
        radius: radius,
        fill: new Fill({
          color: color,
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 1,
        }),
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
    styles.push(
      new Style({
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff',
          }),
          font: '11px Arial',
          offsetY: radius + 4, // 数字显示在圆下方
          stroke: new Stroke({
            color: '#000',
            width: 2,
          }),
        }),
      })
    );
  }

  return styles;
}

// 修改marker函数，支持异步加载图片尺寸
export const marker = (entry: PointData) => {
  const info = entityInfo[entry.entityDataIdKey];
  if (!info || !info?.entityInfo.show) return;

  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });

  // 先设置一个默认样式
  feature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 15,
        fill: new Fill({
          color: getColorForEntity(entry.entityDataIdKey),
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 1,
        }),
      }),
    })
  );

  // 异步加载并设置最终样式
  createCircleIconStyle(entry.entityDataIdKey).then(style => {
    feature.setStyle(style);
  });

  if (!entityGroup[entry.entityDataIdKey]?.points?.length) {
    entityGroup[entry.entityDataIdKey] = {
      name: info.entityInfo.name,
      points: [feature],
    };
  } else {
    entityGroup[entry.entityDataIdKey].points.push(feature);
    entityInfo[entry.entityDataIdKey].entityInfo.count += 1;
  }
  return feature;
};

// 加载数据
for (const point of points) {
  itemMap[point.entityDataIdKey] = (itemMap[point.entityDataIdKey] || 0) + 1;
  const feature = marker(point);
  if (feature) features.push(feature);
}

console.log('醚质总数:', features.length, itemMap);

// 源数据管理
export const source = new VectorSource({
  features: features,
});

// 样式缓存和图层容器
export const styleCache: { [key: string]: Style | Style[] } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

// 刷新所有样式的函数
export const refreshStyles = () => {
  // 清除样式缓存，这样下次渲染时会重新计算样式
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  // 强制刷新所有聚合图层
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });
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

    if (!featuresByType[entityType]) {
      featuresByType[entityType] = [];
    }
    featuresByType[entityType].push(feature);
  }

  // 为每种类型创建单独的聚合源和图层
  for (const entityType in featuresByType) {
    // 跳过不显示的实体类型
    if (!entityInfo[entityType]?.entityInfo.show) continue;

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

    // 创建图层
    const layer = new VectorLayer({
      source: clusterSource,
      style: feature => {
        const size = feature.get('features')?.length;

        // 样式键
        const styleKey = `${entityType}-${size}-${currentZoomLevel}`;

        // 如果缓存中没有样式，创建一个默认样式并异步更新
        if (!styleCache[styleKey]) {
          // 设置默认样式
          const defaultStyle = [
            new Style({
              image: new CircleStyle({
                radius: getCircleRadiusForZoom(15),
                fill: new Fill({
                  color: getColorForEntity(entityType),
                }),
                stroke: new Stroke({
                  color: '#fff',
                  width: 1,
                }),
              }),
            }),
          ];

          // 缓存默认样式
          styleCache[styleKey] = defaultStyle;

          // 异步创建并更新最终样式
          createCircleIconStyle(entityType, size).then(finalStyle => {
            styleCache[styleKey] = finalStyle;
            // 通知图层刷新
            layer.changed();
          });
        }

        // 返回当前缓存的样式（可能是默认样式，也可能是最终样式）
        return styleCache[styleKey];
      },
      zIndex: 10,
    });

    // 保存图层引用
    entityClusterLayers.push(layer);
  }

  return entityClusterLayers;
};

// 更新聚合距离的函数
export const updateClusterDistance = (zoom: number) => {
  // 在最大缩放级别(5)时完全禁用聚合
  const distance =
    zoom >= 4.5 ? 0 : zoom <= 2 ? 30 : zoom <= 3 ? 15 : zoom <= 4 ? 5 : 0;

  // 更新每个聚合源的距离
  Object.values(entityClusterSources).forEach(source => {
    source.setDistance(distance);
  });

  // 清除缓存的样式
  Object.keys(styleCache).forEach(key => delete styleCache[key]);
};

// 强制分散最大缩放级别的聚合点
export const forceDisperseAtMaxZoom = (zoom: number) => {
  if (zoom >= 5) {
    // 在最大缩放级别强制所有聚合源的距离为0
    Object.values(entityClusterSources).forEach(source => {
      source.setDistance(0);
    });
  }
};

// 实现刷新聚合函数
export const refreshCluster = () => {
  // 清空现有的聚合层
  entityClusterLayers.length = 0;
  Object.keys(entityClusterSources).forEach(
    key => delete entityClusterSources[key]
  );

  // 重新创建聚合层
  createEntityClusterLayers();

  // 重置当前缩放级别的聚合距离
  updateClusterDistance(currentZoomLevel);
  // 在最大缩放级别时强制禁用聚合
  if (currentZoomLevel >= 5) {
    forceDisperseAtMaxZoom(currentZoomLevel);
  }
};

// 修改refresh函数，加入更多调试信息
export const refresh = () => {
  for (const key in entityInfo) {
    // 获取该类型的聚合源
    const source = entityClusterSources[key];

    // 如果当前实体类型没有聚合源，跳过处理
    if (!source) continue;

    // 如果该类型的点位应该显示，但源可能是空的
    if (entityInfo[key].entityInfo.show) {
      // 重新添加源中的所有特征，并根据标记状态筛选
      const featuresForType = features.filter(f => {
        const payload = f.get('payload');
        const shouldShow =
          payload?.entityDataIdKey === key &&
          shouldShowByMarkStatus(payload?.seq);
        return shouldShow;
      });

      // 清除并重新添加特征以确保可见性
      const vectorSource = source.getSource();
      if (vectorSource) {
        vectorSource.clear();
        vectorSource.addFeatures(featuresForType);
      }
    } else {
      // 如果该类型不应该显示，清空源
      const vectorSource = source.getSource();
      if (vectorSource) {
        vectorSource.clear();
      }
    }
  }

  // 强制更新所有源的聚合
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });

  // console.log('地图刷新完成');
};

export const select = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  // 调用修改后的refresh函数更新地图显示
  refresh();
};

export const selectAll = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = true;
  }
  refresh();
};

export const toggleSelect = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  refresh();
};

export const toggleSelectByName = (name: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].entityInfo.name === name) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  }
  refresh();
};

export const clear = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = false;
  }
  refresh();
};

export const isSelectAll = computed(() => {
  return Object.keys(entityInfo).every(key => entityInfo[key].entityInfo.show);
});

export const clusterSource = new Cluster({
  distance: 1,
  source: new VectorSource(),
});

// 监听标记筛选状态变化，刷新地图
watch(currentMarkFilter, () => {
  refresh();
});

createEntityClusterLayers();

onMarkChange(() => {
  if (currentMarkFilter.value !== 'all') {
    refresh();
  }
});
