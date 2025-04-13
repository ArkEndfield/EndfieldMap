import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
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

// 重新定义样式缓存类型，使其能够存储更新状态
interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

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
export const source = new VectorSource<Feature<Point>>({
  features: [],
});

// 样式缓存和图层容器
export const styleCache: { [key: string]: StyleCacheEntry } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

// 创建防抖版本的 createCircleIconStyle 函数缓存
const iconStyleCache: { [key: string]: Promise<Style[] | Style> | undefined } =
  {};

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
    int_doodad_core_mine_originium: 'rgba(121, 85, 72, 0.8)',
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

// 修改创建样式的函数，加入图片尺寸自适应和内部尖头装饰
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

// 原始函数现在调用防抖版本
export const updateClusterDistance = (zoom: number) => {
  debouncedUpdateClusterDistance(zoom);
};
