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
import { debounce } from '@/utils/common';
import { cancelRafTimeout, rafTimeout } from '@/utils/animationTimer';

export interface EntityInfo {
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

// 重新定义样式缓存类型，使其能够存储更新状态
interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

// 样式缓存和图层容器
export const styleCache: { [key: string]: StyleCacheEntry } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

// 添加一个全局变量来存储当前的缩放级别
let currentZoomLevel = 3;
// 增加一个缩放级别阈值变量，只有变化超过这个阈值才刷新样式
const ZOOM_THRESHOLD = 0.08;
// 添加一个标志来防止缩放过程中的频繁刷新
let isRefreshingStyles = false;
// 缩放结束后需要刷新的标志
let pendingStyleRefresh = false;
// 防抖计时器ID
let refreshStylesTimerId: number | null = null;

// 创建一个更强的防抖版本的updateCurrentZoom函数
const debouncedUpdateZoomStyles = debounce(
  (zoom: number) => {
    // 避免不必要的更新，如果缩放级别变化很小
    if (Math.abs(currentZoomLevel - zoom) < ZOOM_THRESHOLD) return;

    // 更新缩放级别变量
    const oldZoomLevel = currentZoomLevel;
    currentZoomLevel = zoom;

    // 这里只在缩放级别真正发生变化时更新样式
    if (Math.abs(oldZoomLevel - zoom) >= ZOOM_THRESHOLD) {
      refreshStyles();
    }
  },
  600, // 延长防抖时间到600ms，减少连续缩放中的渲染次数
  { leading: false, trailing: true }
);

// 更新当前缩放级别的函数
export const updateCurrentZoom = (zoom: number) => {
  // 使用四舍五入减少微小的缩放变化导致的更新
  const roundedZoom = Math.round(zoom * 10) / 10;
  const roundedCurrentZoom = Math.round(currentZoomLevel * 10) / 10;

  // 如果缩放级别实际上没有变化（误差小于阈值），完全不做任何操作
  if (roundedZoom === roundedCurrentZoom) return;

  // 存储新的缩放级别，但不立即刷新
  const oldZoomLevel = currentZoomLevel;
  currentZoomLevel = zoom;

  // 只有在缩放级别显著变化时才使用防抖函数
  if (Math.abs(oldZoomLevel - zoom) >= ZOOM_THRESHOLD) {
    // 使用增强的防抖函数，延迟执行样式刷新
    debouncedUpdateZoomStyles(zoom);
  }

  // 清除先前的计时器
  if (refreshStylesTimerId) {
    cancelRafTimeout(refreshStylesTimerId);
    refreshStylesTimerId = null;
  }
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

// 添加一个用于缓存图片尺寸的对象 - 使用LRU缓存机制
const MAX_IMAGE_CACHE_SIZE = 200; // 最大缓存图片数量
const imageSizeCache: Map<
  string,
  { width: number; height: number; lastUsed: number }
> = new Map();
// 添加图片加载状态的缓存，避免重复加载同一图片
const imageLoadingPromises: Map<
  string,
  Promise<{ width: number; height: number }>
> = new Map();

// 预设的常用图片尺寸 - 减少加载和计算时间
const COMMON_IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  // 可以根据项目中常用的图片预先设置尺寸
  default: { width: 32, height: 32 },
  icon: { width: 24, height: 24 },
  marker: { width: 32, height: 32 },
};

// 清理LRU缓存的辅助函数
function cleanImageSizeCache() {
  if (imageSizeCache.size <= MAX_IMAGE_CACHE_SIZE) return;

  // 将缓存条目转换为数组并按最后使用时间排序
  const entries = Array.from(imageSizeCache.entries()).sort(
    (a, b) => a[1].lastUsed - b[1].lastUsed
  );

  // 删除最旧的20%条目
  const deleteCount = Math.floor(imageSizeCache.size * 0.2);
  for (let i = 0; i < deleteCount; i++) {
    if (entries[i]) {
      imageSizeCache.delete(entries[i][0]);
    }
  }
}

// 获取图片尺寸的函数 - 优化版本
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  // 检查是否为常见图片类型
  const pathParts = src.split('/');
  const fileName = pathParts[pathParts.length - 1].split('.')[0];
  if (COMMON_IMAGE_SIZES[fileName]) {
    return Promise.resolve(COMMON_IMAGE_SIZES[fileName]);
  }

  // 如果已经有这个图片的加载Promise，直接返回它
  const existingPromise = imageLoadingPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  // 如果已经缓存了尺寸信息，直接返回并更新使用时间
  const cachedSize = imageSizeCache.get(src);
  if (cachedSize) {
    cachedSize.lastUsed = Date.now();
    return Promise.resolve(cachedSize);
  }

  // 创建新的加载Promise并缓存它
  const loadPromise = new Promise<{ width: number; height: number }>(
    resolve => {
      // 使用 Image 对象池来减少内存压力
      const img = new Image();

      img.onload = () => {
        // 缓存尺寸信息并返回
        const size = {
          width: img.width,
          height: img.height,
          lastUsed: Date.now(),
        };
        imageSizeCache.set(src, size);
        // 加载完成后删除promise缓存
        imageLoadingPromises.delete(src);

        // 定期清理缓存
        cleanImageSizeCache();

        resolve(size);
      };

      img.onerror = () => {
        // 加载失败时使用默认尺寸并记录警告
        console.warn(`无法加载图片: ${src}`);
        // 使用默认尺寸
        const defaultSize = { width: 32, height: 32, lastUsed: Date.now() };
        // 缓存默认尺寸以避免再次尝试加载失败的图片
        imageSizeCache.set(src, defaultSize);
        // 删除promise缓存
        imageLoadingPromises.delete(src);
        resolve(defaultSize);
      };

      // 设置图片源，开始加载
      img.src = src;
    }
  );

  // 缓存加载Promise
  imageLoadingPromises.set(src, loadPromise);
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

// 创建防抖版本的 createCircleIconStyle 函数缓存
const iconStyleCache: { [key: string]: Promise<Style[] | Style> | undefined } =
  {};

// 修改创建样式的函数，加入图片尺寸自适应和内部尖头装饰
async function createCircleIconStyle(entityType: string, size: number = 1) {
  // 使用缓存键，避免重复创建相同样式
  const cacheKey = `${entityType}-${size}-${
    Math.round(currentZoomLevel * 10) / 10
  }`;

  // 如果已经有缓存的样式创建请求，直接返回它
  if (iconStyleCache[cacheKey] !== undefined) {
    return iconStyleCache[cacheKey];
  }

  // 创建新的样式创建请求
  const stylePromise = (async () => {
    const color = getColorForEntity(entityType);
    const radius = 15;

    // 计算图标的目标尺寸（圆形半径的比例）
    const targetIconSize = radius * 1.4; // 图标最大可占用圆形直径的70%

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
            font: '8px "Noto Sans SC"',
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

  // 应用样式
  applyFeatureStyle(feature, entry.entityDataIdKey);

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

// 提取的应用样式函数，可以单独调用以更新样式
export const applyFeatureStyle = (
  feature: Feature<Point>,
  entityTypeKey: string
) => {
  // 样式缓存键
  const styleKey = `${entityTypeKey}-1-${
    Math.round(currentZoomLevel * 10) / 10
  }`;

  // 不设置初始样式，而是设置一个不可见的样式，等待最终样式加载
  feature.setStyle(new Style({})); // 空样式，实际上是不可见的

  // 加载和应用最终样式
  if (!iconStyleCache[styleKey]) {
    // 创建样式并直接应用，避免中间状态
    const stylePromise = createCircleIconStyle(entityTypeKey).then(style => {
      // 仅当样式缓存还不存在时才设置
      if (!iconStyleCache[styleKey]) {
        iconStyleCache[styleKey] = Promise.resolve(style);
      }
      // 检查特征是否仍然有效（未被移除）
      if (features.includes(feature)) {
        feature.setStyle(style);
      }
      return style;
    });

    // 缓存样式创建请求
    iconStyleCache[styleKey] = stylePromise;
  } else {
    // 如果已经有缓存的样式，则应用它
    iconStyleCache[styleKey].then(style => {
      // 检查特征是否仍然有效（未被移除）
      if (features.includes(feature)) {
        feature.setStyle(style);
      }
    });
  }
};

// 单独更新聚合标点样式的函数
export const updateClusterMarkerStyles = (zoom?: number) => {
  if (zoom !== undefined) {
    currentZoomLevel = zoom;
  }

  // 为每个特征更新样式
  features.forEach(feature => {
    const payload = feature.get('payload');
    if (payload && payload.entityDataIdKey) {
      applyFeatureStyle(feature, payload.entityDataIdKey);
    }
  });

  // 更新聚合相关设置
  updateClusterDistance(currentZoomLevel);

  // 在最大缩放级别时强制禁用聚合
  if (currentZoomLevel >= 5) {
    forceDisperseAtMaxZoom(currentZoomLevel);
  }

  // 通知图层刷新
  entityClusterLayers.forEach(layer => {
    layer.changed();
  });

  // 清理不再需要的样式缓存
  const currentZoomRounded = Math.round(currentZoomLevel * 10) / 10;
  Object.keys(styleCache).forEach(key => {
    if (!key.includes(`-${currentZoomRounded}`)) {
      delete styleCache[key];
    }
  });
};

// 刷新所有样式的函数
export const refreshStyles = () => {
  // 如果已经在刷新中，标记待处理并退出
  if (isRefreshingStyles) {
    pendingStyleRefresh = true;
    return;
  }

  // 设置正在刷新标志
  isRefreshingStyles = true;

  // 使用优化的渲染策略：不再使用透明度变化，而是保持旧图层完整直到新图层准备好
  requestAnimationFrame(() => {
    try {
      // 创建样式的深度副本，而不是仅标记它们
      const oldStyleCache = {};
      Object.keys(styleCache).forEach(key => {
        oldStyleCache[key] = {
          style: Array.isArray(styleCache[key].style)
            ? [...styleCache[key].style]
            : styleCache[key].style,
          needsUpdate: false,
        };
      });

      // 保持原有图层的引用和可见性，而不是改变透明度
      entityClusterLayers.forEach(layer => {
        // 添加自定义属性来标记图层状态而不是修改透明度
        layer.set('isRefreshing', true);
      });

      // 重要：移除"正在刷新"标记，但不触发重绘
      rafTimeout(() => {
        entityClusterLayers.forEach(layer => {
          layer.set('isRefreshing', false);
          // 静默通知图层数据已更新，但不强制重绘
          layer.changed();
        });
      }, 50);

      // 延迟清理旧样式，给新样式加载留出充足时间
      rafTimeout(() => {
        // 现在可以安全地清理不需要的资源
        Object.keys(oldStyleCache).forEach(key => {
          if (styleCache[key] && styleCache[key].needsUpdate) {
            delete styleCache[key].needsUpdate;
          }
        });
      }, 300);
    } finally {
      // 重置刷新状态，但给足时间确保所有样式都已完全应用
      rafTimeout(() => {
        isRefreshingStyles = false;

        // 处理待处理的刷新请求
        if (pendingStyleRefresh) {
          pendingStyleRefresh = false;
          // 延迟执行下一次刷新，避免连续刷新造成的闪烁
          rafTimeout(() => {
            refreshStyles();
          }, 300); // 增加时间间隔，避免频繁刷新
        }
      }, 100);
    }
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

    // 创建图层 - 确保默认不可见
    const layer = new VectorLayer({
      source: clusterSource,
      style: feature => {
        const size = feature.get('features')?.length;

        // 样式键
        const styleKey = `${entityType}-${size}-${currentZoomLevel}`;

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

// 更新聚合距离的函数 - 添加防抖处理
const debouncedUpdateClusterDistance = debounce(
  (zoom: number) => {
    // 获取当前聚合状态 - 简化为只有两种状态：聚合(30)或不聚合(0)
    const shouldCluster = zoom < 4;
    const newDistance = shouldCluster ? 30 : 0;

    // 检查是否需要更新聚合状态 - 比较当前第一个聚合源的距离
    const currentSources = Object.values(entityClusterSources);
    if (currentSources.length > 0) {
      const currentDistance = currentSources[0].getDistance();

      // 只有当聚合状态发生变化时才更新
      if (
        (shouldCluster && currentDistance === 0) ||
        (!shouldCluster && currentDistance > 0)
      ) {
        console.log(
          `聚合状态变化：${currentDistance} -> ${newDistance}，开始更新聚合图层`
        );

        // 更新每个聚合源的距离
        Object.values(entityClusterSources).forEach(source => {
          source.setDistance(newDistance);
        });

        // 清除缓存的样式
        Object.keys(styleCache).forEach(key => delete styleCache[key]);
      }
    } else {
      // 如果尚未创建聚合源，直接返回
      console.log('聚合源尚未初始化，跳过更新');
    }
  },
  250,
  { leading: false, trailing: true }
);

// 强制分散最大缩放级别的聚合点 - 添加防抖处理
const debouncedForceDisperseAtMaxZoom = debounce(
  (zoom: number) => {
    if (zoom >= 5) {
      // 在最大缩放级别强制所有聚合源的距离为0
      Object.values(entityClusterSources).forEach(source => {
        source.setDistance(0);
      });
    }
  },
  250,
  { leading: false, trailing: true }
);

// 原始函数现在调用防抖版本
export const updateClusterDistance = (zoom: number) => {
  debouncedUpdateClusterDistance(zoom);
};

export const forceDisperseAtMaxZoom = (zoom: number) => {
  debouncedForceDisperseAtMaxZoom(zoom);
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
  if (currentZoomLevel >= 4) {
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

  // 不再清理样式缓存，减少不必要的重新渲染
  // Object.keys(styleCache).forEach(key => delete styleCache[key]);

  // 不再清理所有源，而是控制图层可见性
  for (const key in entityInfo) {
    const source = entityClusterSources[key];
    if (!source) continue;

    // 查找对应的图层
    const layer = entityClusterLayers.find(l => l.getSource() === source);

    if (!layer) continue;

    // 检查是否需要显示该类型的实体
    const shouldShowEntityType = entityInfo[key].entityInfo.show;

    // 通过设置图层可见性来控制标点显示/隐藏，而不是重新添加/删除特征
    layer.setVisible(shouldShowEntityType);

    // 如果需要显示，则根据标记状态更新特征集合
    if (shouldShowEntityType) {
      // 获取原始的矢量源
      const vectorSource = source.getSource();
      if (!vectorSource) continue;

      // 在执行过滤前清空源
      vectorSource.clear();

      // 找出属于这个类型的所有特征
      let typeFeatures = features.filter(f => {
        const payload = f.get('payload');
        return payload?.entityDataIdKey === key;
      });

      // 如果不是"全部"筛选状态，则根据标记状态进行过滤
      if (currentMarkFilter.value !== 'all') {
        typeFeatures = typeFeatures.filter(f => {
          const payload = f.get('payload');
          return shouldShowByMarkStatus(payload?.levelLogicId);
        });
      }

      // 如果有特征要显示，添加到对应的源
      if (typeFeatures.length > 0) {
        vectorSource.addFeatures(typeFeatures);
      }
    }
  }

  // 更新聚合距离
  updateClusterDistance(currentZoomLevel);

  // 在最大缩放级别时强制禁用聚合
  if (currentZoomLevel >= 5) {
    forceDisperseAtMaxZoom(currentZoomLevel);
  }
};

// 创建一个防抖版本的refresh函数，延迟300ms执行，避免短时间内频繁刷新
export const debouncedRefresh = debounce(refresh, 300, {
  leading: false,
  trailing: true,
});

// 添加一个用于筛选操作的即时刷新函数
export const immediateRefresh = () => {
  // 直接调用refresh，无延迟
  refresh();
};

// 优化的selectAll函数
export const selectAll = () => {
  // 清理样式缓存以避免内存泄漏
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = true;
  }

  // 使用即时刷新函数，提高用户体验
  immediateRefresh();
};

// 优化的clear函数
export const clear = () => {
  // 清理样式缓存以避免内存泄漏
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = false;
  }

  // 使用即时刷新函数，提高用户体验
  immediateRefresh();
};

export const select = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  // 使用即时刷新函数，提高用户体验
  immediateRefresh();
};

export const toggleSelect = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  immediateRefresh();
};

export const toggleSelectByName = (name: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].entityInfo.name === name) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  }
  immediateRefresh();
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
  immediateRefresh();
});

// 获取实体类型对应的点位集合
export const getPointsByEntityType = async (
  entityType: string
): Promise<PointData[]> => {
  const currentPoints = await getCurrentPoints();
  return currentPoints.filter(point => point.entityDataIdKey === entityType);
};

// 初始化地图
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

    console.log(`成功初始化 ${features.length} 个实体特征`);

    // 默认隐藏所有实体
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.show = false;
      }
    });
  } catch (error) {
    console.error('初始化实体信息时发生错误:', error);
    throw error;
  }
}
