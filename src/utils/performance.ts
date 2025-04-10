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
// CPU使用历史记录
const cpuHistory: number[] = [];
// 追踪内存使用的时间间隔（毫秒）
const MEMORY_CHECK_INTERVAL = 5000;
// 追踪CPU使用的时间间隔（毫秒）
const CPU_CHECK_INTERVAL = 2000;
// 历史记录的最大长度
const MAX_HISTORY_LENGTH = 10;
// 内存增长阈值（MB）- 超过此值会发出警告
const MEMORY_GROWTH_THRESHOLD = 50;
// CPU使用阈值（%）- 超过此值会发出警告
const CPU_USAGE_THRESHOLD = 80;

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
 * 开始监控CPU使用情况
 * 通过分析帧率、任务执行时间和CPU核心数来评估CPU负载
 */
export function monitorCPU() {
  // 获取CPU核心数
  const cpuCores = navigator.hardwareConcurrency || 4;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fps = 60; // 默认帧率

  // 用于测量帧率的动画帧回调函数
  let frameId: number;
  const frameCallback = () => {
    frameCount++;
    frameId = requestAnimationFrame(frameCallback);
  };

  // 启动帧率测量
  frameId = requestAnimationFrame(frameCallback);

  // 用于存储任务执行时间的历史数据
  const taskTimeHistory: number[] = [];
  const MAX_TASK_HISTORY = 10;

  // 定期测量CPU使用情况
  const cpuCheckInterval = setInterval(() => {
    // 计算平均帧率
    const currentTime = performance.now();
    const elapsedSec = (currentTime - lastFrameTime) / 1000;
    if (elapsedSec >= 1) {
      // 如果经过了至少1秒
      fps = Math.round(frameCount / elapsedSec);
      frameCount = 0;
      lastFrameTime = currentTime;
    }

    // 测量密集任务执行时间（用作CPU负载指标）
    const startTime = performance.now();
    const standardWorkload = 1000000; // 增加工作负载，使测量更准确

    // 执行计算密集型任务来测试CPU响应性
    let result = 0;
    for (let i = 0; i < standardWorkload; i++) {
      result += Math.sqrt(i * Math.sin(i));
    }

    const taskTime = performance.now() - startTime;

    // 获取一个基准值（理想状态下执行此任务的预期时间）
    // 根据设备性能动态调整
    const baseLine = 15 / (navigator.hardwareConcurrency || 4); // 默认基准，考虑CPU核心数

    // 保存任务执行时间历史
    taskTimeHistory.push(taskTime);
    if (taskTimeHistory.length > MAX_TASK_HISTORY) {
      taskTimeHistory.shift();
    }

    // 计算平均任务执行时间
    const avgTaskTime =
      taskTimeHistory.reduce((sum, time) => sum + time, 0) /
      taskTimeHistory.length;

    // 结合帧率和任务时间估算CPU使用率
    // 帧率低且任务执行时间长表示CPU负载高
    const fpsImpact = Math.max(0, 1 - fps / 60); // 帧率影响因子，低帧率意味着高CPU负载
    const taskImpact = Math.min(1, avgTaskTime / (baseLine * 10)); // 任务时间影响因子

    // 估算CPU使用率：结合多个因素且更敏感地反映系统负载
    const rawCpuUsage = (0.6 * taskImpact + 0.4 * fpsImpact) * 100;

    // 确保结果在20-100范围内（即使在空闲状态也显示一些基础使用率）
    const cpuUsage = Math.min(100, Math.max(20, Math.round(rawCpuUsage)));

    // 添加到历史记录
    cpuHistory.push(cpuUsage);

    // 保持历史记录在最大长度以内
    if (cpuHistory.length > MAX_HISTORY_LENGTH) {
      cpuHistory.shift();
    }

    // 检查CPU使用率是否过高
    if (cpuUsage > CPU_USAGE_THRESHOLD) {
      console.warn(`警告: 检测到高CPU使用率 ${cpuUsage}%`);
      console.warn('建议优化应用程序逻辑或减少并发任务');
    }

    // 记录当前CPU使用情况
    console.log(
      `当前CPU使用率: ${cpuUsage}%, 帧率: ${fps}fps, 核心数: ${cpuCores}`
    );
  }, CPU_CHECK_INTERVAL);

  // 页面卸载时清除定时器和动画帧
  window.addEventListener('beforeunload', () => {
    clearInterval(cpuCheckInterval);
    cancelAnimationFrame(frameId);
  });

  // 返回清理函数
  return () => {
    clearInterval(cpuCheckInterval);
    cancelAnimationFrame(frameId);
  };
}

/**
 * 获取CPU使用历史数据
 * @returns 包含CPU使用率历史数据的数组
 */
export function getCPUHistory(): number[] {
  return [...cpuHistory];
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
    let arr: any[][] = [];
    for (let i = 0; i < 10000; i++) {
      arr.push(new Array(10000).fill(Math.random()));
    }
    arr = []; // 清空数组而不是设为null
  }
}

/**
 * 获取内存使用历史数据
 * @returns 包含内存使用历史数据的数组
 */
export function getMemoryHistory(): number[] {
  return [...memoryHistory];
}

/**
 * 启动综合性能监控（同时监控内存和CPU）
 */
export function startPerformanceMonitoring() {
  console.log('启动综合性能监控...');

  // 启动内存监控
  monitorMemory();

  // 启动CPU监控
  monitorCPU();

  // 设置定期打印性能报告
  const reportInterval = setInterval(() => {
    printPerformanceReport();
  }, 10000); // 每10秒打印一次报告

  // 页面卸载时清除定时器
  window.addEventListener('beforeunload', () => {
    clearInterval(reportInterval);
  });

  return {
    stop: () => {
      clearInterval(reportInterval);
      console.log('已停止性能监控');
    },
  };
}

/**
 * 打印性能报告
 */
function printPerformanceReport() {
  console.group('性能监控报告');

  // 打印CPU使用情况
  const cpuData = getCPUHistory();
  if (cpuData.length > 0) {
    const lastCpuUsage = cpuData[cpuData.length - 1];
    const avgCpuUsage =
      cpuData.reduce((sum, val) => sum + val, 0) / cpuData.length;
    console.log(
      `CPU使用率: 当前 ${lastCpuUsage}%, 平均 ${avgCpuUsage.toFixed(2)}%`
    );
  }

  // 打印内存使用情况
  const memData = getMemoryHistory();
  if (memData.length > 0) {
    const lastMemUsage = memData[memData.length - 1];
    console.log(`内存使用: 当前 ${lastMemUsage} MB`);

    // 计算内存增长率
    if (memData.length > 1) {
      const memoryGrowthRate =
        ((memData[memData.length - 1] - memData[0]) / memData[0]) * 100;
      console.log(`内存增长率: ${memoryGrowthRate.toFixed(2)}% (自监控开始)`);
    }
  }

  console.groupEnd();
}
