import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import {
  map,
  entityLayerTimerId,
  setEntityLayersLoaded,
  setEntityLayerTimerId,
} from './state';
import { getEntityClusterLayers, refreshMap } from '../render';
import { cancelRafTimeout, rafTimeout } from '@/utils/animationTimer';
import { MAX_RETRIES } from './constants';

/**
 * 类型保护函数：判断是否为 VectorSource
 */
export function isVectorSource(source: any): source is VectorSource {
  return source && typeof source.clear === 'function';
}

/**
 * 类型保护函数：判断是否为 Cluster Source
 */
export function isClusterSource(source: any): source is Cluster {
  return source && typeof source.getSource === 'function';
}

/**
 * 添加实体图层到地图，支持重试逻辑
 * @param currentRetry 当前重试次数
 */
export function addEntityLayersToMap(currentRetry = 0): void {
  // 清除之前的计时器
  if (entityLayerTimerId !== null) {
    cancelRafTimeout(entityLayerTimerId);
    setEntityLayerTimerId(null);
  }

  if (!map.value) {
    console.warn('地图实例不存在，无法添加实体图层');
    return;
  }

  const layers = getEntityClusterLayers();
  if (layers.length > 0) {
    // 只在开发环境记录详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`添加 ${layers.length} 个实体图层到地图`);
    }

    // 分批添加图层，避免长时间阻塞主线程
    const batchSize = 10; // 增加每批处理量以减少批次
    const addLayersBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, layers.length);
      const currentBatch = layers.slice(startIndex, endIndex);

      // 预先分配数组
      const layersToAdd = new Array(currentBatch.length);

      // 首先设置所有图层为不可见
      for (let i = 0; i < currentBatch.length; i++) {
        const layer = currentBatch[i];
        layer.setVisible(false);
        layersToAdd[i] = layer;
      }

      // 使用一次调用添加所有图层
      if (map.value && layersToAdd.length > 0) {
        map.value.getLayers().extend(layersToAdd);
      }

      // 如果还有剩余图层，继续添加下一批
      if (endIndex < layers.length) {
        rafTimeout(() => {
          addLayersBatch(endIndex);
        }, 0);
      } else {
        // 所有图层添加完成
        setEntityLayersLoaded(true);

        // 在开发环境下打印加载成功信息
        if (process.env.NODE_ENV === 'development') {
          console.log('实体图层加载成功');
        }

        // 在实体图层成功添加到地图后，主动调用refreshMap显示标点
        refreshMap();
      }
    };

    // 开始分批添加
    addLayersBatch(0);
    return;
  }

  // 如果还没有实体图层数据，但未超过最大重试次数，则继续尝试
  if (currentRetry < MAX_RETRIES) {
    // 只在开发环境记录详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `实体图层数据尚未准备好，${currentRetry + 1}/${MAX_RETRIES} 次重试中...`
      );
    }

    // 递增重试间隔（指数退避）
    const delay = Math.min(500 * Math.pow(1.5, currentRetry), 5000);

    const timerId = rafTimeout(() => {
      addEntityLayersToMap(currentRetry + 1);
    }, delay);
    setEntityLayerTimerId(timerId);
  } else {
    console.warn('达到最大重试次数，实体图层加载失败');
  }
}
