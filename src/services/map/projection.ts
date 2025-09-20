import { Projection } from 'ol/proj';
import { MAX_POOLED_IMAGES } from './constants';
import {
  imagePool,
  addImageToPool,
  removeImageFromPool,
  getImageFromPool,
} from './state';

// 创建简单投影
export const simpleProjection = new Projection({
  code: 'SIMPLE',
  units: 'pixels',
  extent: [0, 0, 256, 256],
});

// 优化的瓦片加载函数，使用图像池
export const tileLoad = (imageTile: any, src: string) => {
  // 尝试从图像池获取图像
  let img = getImageFromPool(src);

  if (!img) {
    img = new Image();

    // 计算当前池大小
    const poolSize = Object.keys(imagePool).length;
    if (poolSize < MAX_POOLED_IMAGES) {
      // 添加到图像池
      addImageToPool(src, img);
    }
  }

  const listenerAC = new AbortController()
  // 重置事件处理程序
  img.addEventListener('load', () => {
    imageTile.getImage().src = src;
    // 完成后移除监听器以避免内存泄漏
    listenerAC.abort();
  }, { signal: listenerAC.signal });

  img.addEventListener('error',() => {
    // 完成后移除监听器以避免内存泄漏
    listenerAC.abort();

    // 错误时从池中删除
    removeImageFromPool(src);
  }, { signal: listenerAC.signal });

  // 设置图像源（这将触发加载）
  img.src = src;
};
