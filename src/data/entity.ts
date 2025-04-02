import { xyz2crd } from '@/utils/common';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
  RegularShape,
} from 'ol/style';
import { computed, reactive, watch } from 'vue';
import Cluster from 'ol/source/Cluster';
import VectorLayer from 'ol/layer/Vector';
import { type PointData, getCurrentPoints } from './points';
import { currentMarkFilter, shouldShowByMarkStatus } from './marks';
import { loadJSON } from '@/utils/jsonLoader';

interface EntityInfo {
  name: string;
  point: string;
  pic: string;
  show: boolean;
  count: number;
  scale?: number;
}

// 副本点位
type EntityCategory =
  | 'ether'
  | 'chest'
  | 'special'
  | 'dungeon'
  | 'mineral'
  | 'plant'
  | 'spcstone'
  | 'settlement'
  | 'enemy';

type EntityCategories = Record<
  string,
  {
    category: EntityCategory;
    entityInfo: EntityInfo;
  }
>;

// 实体信息
export const entityInfo: EntityCategories = reactive({});

// 加载实体数据
export async function loadEntityData() {
  try {
    const data = await loadJSON<EntityCategories>('/data/entity.json');
    // 清空当前数据
    Object.keys(entityInfo).forEach(key => {
      delete entityInfo[key];
    });
    // 添加新数据
    Object.entries(data).forEach(([key, value]) => {
      entityInfo[key] = value;
    });
    return entityInfo;
  } catch (error) {
    console.error('加载实体数据失败:', error);
    throw error;
  }
}

export const categoryInfo = computed(() => {
  // 定义类别顺序
  const categoryOrder: EntityCategory[] = [
    'settlement', // 定居点
    'dungeon', // 副本点位
    'chest', // 宝箱
    'mineral', // 矿物
    'spcstone', // 稀有矿物
    'plant', // 植物类素材
    'ether', // 醚质
    'enemy', // 敌人
    'special', // 特殊点位
  ];

  // 创建一个有序的分类对象
  const categories: Record<string, EntityInfo[]> = {};

  // 先按照顺序初始化所有分类
  categoryOrder.forEach(category => {
    categories[category] = [];
  });

  // 将实体信息填充到对应分类中，只包含 count > 0 的实体
  for (const key in entityInfo) {
    const entity = entityInfo[key];
    if (entity.entityInfo.count > 0) {
      // 只处理 count > 0 的实体
      const category = entity.category;
      if (categories[category]) {
        categories[category].push(entity.entityInfo);
      }
    }
  }

  // 过滤掉空的分类
  const filteredCategories: Record<string, EntityInfo[]> = {};
  categoryOrder.forEach(category => {
    if (categories[category].length > 0) {
      filteredCategories[category] = categories[category];
    }
  });

  return filteredCategories;
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

// 源数据管理
export const source = new VectorSource<Feature<Point>>({
  features: [],
});

// 样式缓存和图层容器
export const styleCache: { [key: string]: Style | Style[] } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

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

// 修改创建样式的函数，加入图片尺寸自适应和内部尖头装饰
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
    styles.push(
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
          font: '8px Arial',
          offsetY: radius - 5, // 数字显示在圆下方
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

// 初始化点位标记
export const marker = (entry: PointData) => {
  const info = entityInfo[entry.entityDataIdKey];
  if (!info) return;

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
  }
  return feature;
};

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

    // 只处理当前地图中存在的实体类型
    if (entityInfo[entityType]?.entityInfo.count > 0) {
      if (!featuresByType[entityType]) {
        featuresByType[entityType] = [];
      }
      featuresByType[entityType].push(feature);
    }
  }

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

// 重新初始化实体图层
export const reinitializeEntityLayers = async () => {
  // 保存原有的显示状态
  const showStates = Object.fromEntries(
    Object.entries(entityInfo).map(([key, info]) => [key, info.entityInfo.show])
  );

  // 清空现有图层和源 - 增强清理过程以防止内存泄漏
  entityClusterLayers.forEach(layer => {
    if (layer.getSource()) {
      const source = layer.getSource();
      // 清理聚合源
      if (source && 'getSource' in source) {
        const vectorSource = source.getSource();
        if (vectorSource) {
          vectorSource.clear();
        }
        // 移除聚合关联
        source.setSource(null);
      }
    }
    // 确保图层从所有可能的集合中移除
    layer.setSource(null);
  });

  // 清空数组
  entityClusterLayers.length = 0;

  // 明确清理聚合源对象
  Object.keys(entityClusterSources).forEach(key => {
    const source = entityClusterSources[key];
    if (source) {
      // 清理内部向量源
      const innerSource = source.getSource();
      if (innerSource) {
        innerSource.clear();
      }
      source.setSource(null);
    }
    delete entityClusterSources[key];
  });

  // 清理特征数组
  features.length = 0;

  // 清理样式缓存
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  // 清理实体分组数据
  Object.keys(entityGroup).forEach(key => {
    if (entityGroup[key] && entityGroup[key].points) {
      entityGroup[key].points.length = 0;
    }
    delete entityGroup[key];
  });

  // 清理项目映射
  Object.keys(itemMap).forEach(key => delete itemMap[key]);

  // 输出清理记录
  // console.log('已清理实体图层资源');

  try {
    // 重新初始化实体信息
    const currentPoints = await getCurrentPoints();
    await initializeEntityInfo(currentPoints);

    // 恢复显示状态（只针对新地图中存在的实体）
    for (const key in entityInfo) {
      if (entityInfo[key].entityInfo && showStates[key] !== undefined) {
        entityInfo[key].entityInfo.show = showStates[key];
      }
    }

    // 重新创建聚合图层
    createEntityClusterLayers();

    // 刷新聚合
    refreshCluster();

    // 最后调用 refresh 来根据显示状态过滤特征
    refresh();
  } catch (error) {
    console.error('重新初始化实体图层失败:', error);
    throw error;
  }
};

// 修改refresh函数，加入更多调试信息
export const refresh = () => {
  // 确保所有源都被正确初始化
  if (Object.keys(entityClusterSources).length === 0) {
    createEntityClusterLayers();
  }

  // 清理样式缓存以避免内存泄漏
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  // 先清理所有源
  Object.values(entityClusterSources).forEach(source => {
    const vectorSource = source.getSource();
    if (vectorSource) {
      vectorSource.clear();
    }
  });

  // 为每个实体类型分配特征
  for (const key in entityInfo) {
    const source = entityClusterSources[key];
    if (!source) continue;

    // 只处理需要显示的类型
    if (entityInfo[key].entityInfo.show) {
      // 找出属于这个类型的所有特征
      const featuresForType = features.filter(f => {
        const payload = f.get('payload');
        return (
          payload?.entityDataIdKey === key &&
          shouldShowByMarkStatus(payload?.levelLogicId)
        );
      });

      // 如果有特征要显示，添加到对应的源
      const vectorSource = source.getSource();
      if (vectorSource && featuresForType.length > 0) {
        vectorSource.addFeatures(featuresForType);
      }
    }
  }

  // 强制更新所有源的聚合
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });

  // 更新聚合距离
  updateClusterDistance(currentZoomLevel);

  // 在最大缩放级别时强制禁用聚合
  if (currentZoomLevel >= 5) {
    forceDisperseAtMaxZoom(currentZoomLevel);
  }

  // 请求垃圾回收（虽然不是强制的，但可能有助于提示浏览器）
  if (window.gc) {
    try {
      window.gc();
    } catch (e) {
      // 大多数浏览器不支持手动触发GC，忽略错误
    }
  }
};

// 优化的selectAll函数
export const selectAll = () => {
  // 清理样式缓存以避免内存泄漏
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = true;
  }

  // 刷新显示
  refresh();
};

// 优化的clear函数
export const clear = () => {
  // 清理样式缓存以避免内存泄漏
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = false;
  }

  // 刷新显示
  refresh();
};

export const select = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  // 调用修改后的refresh函数更新地图显示
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

// 获取实体类型对应的点位集合
export const getPointsByEntityType = async (
  entityType: string
): Promise<PointData[]> => {
  const currentPoints = await getCurrentPoints();
  return currentPoints.filter(point => point.entityDataIdKey === entityType);
};

// 修改初始化调用为异步方式
export async function initializeMap() {
  try {
    await loadEntityData(); // 先加载实体数据
    const currentPoints = await getCurrentPoints(); // 使用导入的获取当前点位的函数
    await initializeEntityInfo(currentPoints); // 使用当前点位数组
    createEntityClusterLayers(); // 最后创建图层
  } catch (error) {
    console.error('初始化地图失败:', error);
    throw error;
  }
}

// 初始化实体信息
export async function initializeEntityInfo(pointsData: PointData[]) {
  // 参数检查
  if (!pointsData || !Array.isArray(pointsData)) {
    console.error('初始化实体信息失败: points 参数无效', pointsData);
    return;
  }

  // 确保entityInfo已经加载
  if (Object.keys(entityInfo).length === 0) {
    try {
      await loadEntityData();
    } catch (error) {
      console.error('加载实体数据失败:', error);
      return;
    }
  }

  try {
    console.log('开始初始化实体信息，点位数量:', pointsData.length);

    // 清空现有数据
    features.length = 0;
    Object.keys(itemMap).forEach(key => delete itemMap[key]);
    Object.keys(entityGroup).forEach(key => {
      if (entityGroup[key] && entityGroup[key].points) {
        entityGroup[key].points.length = 0;
      }
      delete entityGroup[key];
    });

    // 重置所有实体的计数
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.count = 0;
      }
    });

    // 清空source中的features
    source.clear();

    // 处理每个点位
    for (const point of pointsData) {
      // 更新entityInfo计数
      if (entityInfo[point.entityDataIdKey]?.entityInfo) {
        entityInfo[point.entityDataIdKey].entityInfo.count++;
      }

      // 创建并添加feature
      const feature = marker(point);
      if (feature) {
        features.push(feature);
        itemMap[point.levelLogicId] = feature;
      }
    }

    // 将features添加到source中
    source.addFeatures(features);

    // 重新创建entity cluster layers
    createEntityClusterLayers();

    // 刷新cluster
    refreshCluster();

    // 使用setTimeout确保地图显示正确
    setTimeout(() => {
      refreshStyles();
      source.changed();
    }, 100);

    console.log(`成功初始化 ${features.length} 个实体特征`);

    // 默认显示所有实体
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.show = true;
      }
    });

    // 最后调用refresh来显示所有点位
    refresh();
  } catch (error) {
    console.error('初始化实体信息时发生错误:', error);
    throw error;
  }
}
