/**
 * 性能监控工具
 */

// 为Chrome浏览器的performance.memory扩展类型定义
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// 扩展Performance接口以包含memory属性
declare global {
  interface Performance {
    memory?: MemoryInfo;
  }
}

// 内存使用历史记录
const memoryHistory: number[] = [];
// 追踪内存使用的时间间隔（毫秒）
const MEMORY_CHECK_INTERVAL = 5000;
// 历史记录的最大长度
const MAX_HISTORY_LENGTH = 10;
// 内存增长阈值（MB）- 超过此值会发出警告
const MEMORY_GROWTH_THRESHOLD = 50;

/**
 * 开始监控内存使用情况
 */
export function monitorMemory() {
  // 检查是否支持性能API和内存信息
  if (!window.performance || !window.performance.memory) {
    console.log('此浏览器不支持内存使用监控');
    return;
  }

  // 定期记录内存使用情况
  const memoryCheckInterval = setInterval(() => {
    const memoryInfo = window.performance.memory;

    if (!memoryInfo) return;

    const usedHeapSize = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024));

    // 添加到历史记录
    memoryHistory.push(usedHeapSize);

    // 保持历史记录在最大长度以内
    if (memoryHistory.length > MAX_HISTORY_LENGTH) {
      memoryHistory.shift();
    }

    // 检查内存增长趋势
    if (memoryHistory.length >= 3) {
      checkMemoryGrowth();
    }

    // 记录当前内存使用情况
    console.log(`当前内存使用: ${usedHeapSize} MB`);
  }, MEMORY_CHECK_INTERVAL);

  // 页面卸载时清除定时器
  window.addEventListener('beforeunload', () => {
    clearInterval(memoryCheckInterval);
  });
}

/**
 * 检查内存增长趋势
 */
function checkMemoryGrowth() {
  const historyLength = memoryHistory.length;

  if (historyLength < 3) return;

  // 计算最近三个点的内存增长
  const current = memoryHistory[historyLength - 1];
  const previous = memoryHistory[historyLength - 3];
  const growth = current - previous;

  // 检查是否持续增长
  if (growth > MEMORY_GROWTH_THRESHOLD) {
    console.warn(`警告: 检测到内存持续增长 ${growth} MB，可能存在内存泄漏`);
    console.warn('建议刷新页面或检查应用程序逻辑');
  }
}

/**
 * 主动请求浏览器进行垃圾回收（仅供开发时使用）
 * 注意：在大多数浏览器中，这个操作实际上不会强制触发GC
 */
export function requestGarbageCollection() {
  if (window.gc) {
    try {
      window.gc();
      console.log('已请求垃圾回收');
    } catch (e) {
      console.log('无法请求垃圾回收');
    }
  } else {
    // 尝试通过创建大量对象然后释放的方式来间接触发GC
    console.log('请求浏览器考虑进行垃圾回收');
  }
}
