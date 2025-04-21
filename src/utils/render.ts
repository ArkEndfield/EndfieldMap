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
export function getImageSize(
  src: string
): Promise<{ width: number; height: number }> {
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

// 为实体类型获取颜色
export function getColorForEntity(entityType: string): string {
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

// 根据图片尺寸计算最适合的缩放比例
export function calculateOptimalScale(
  imageWidth: number,
  imageHeight: number,
  targetSize: number
): number {
  // 取图片的最大边长
  const maxDimension = Math.max(imageWidth, imageHeight);
  // 计算需要的缩放比例，使最大边长适应目标尺寸
  return targetSize / maxDimension;
}
