import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import VueViewer from 'v-viewer';
import 'viewerjs/dist/viewer.css'; // 确保导入CSS
import './types/global.d';
import { checkAppReady } from './utils/check';
import { disableContextMenu, disableZoom } from './utils/device';
import i18n from './i18n';
import {
  initStorageSystem,
  setupCacheCleanupScheduler,
} from './utils/storageInit';
import { initDB } from './utils/indexedDBStorage';
import { loadPoints } from './services/points';

// 应用启动序列 - 确保顺序执行所有初始化步骤
async function initializeApp() {
  console.log('🚀 开始应用初始化序列...');

  try {
    // 步骤1: 初始化 IndexedDB 数据库
    console.log('步骤1: 初始化 IndexedDB 数据库');
    await initDB();

    // 步骤2: 初始化存储系统
    console.log('步骤2: 初始化存储系统');
    await initStorageSystem();

    // 步骤3: 预加载点位数据
    console.log('步骤3: 预加载点位数据');
    const points = await loadPoints();
    console.log(`预加载了 ${points?.length || 0} 个点位数据`);

    console.log('✅ 应用初始化序列完成，准备挂载应用');

    // 创建应用实例
    const app = createApp(App);

    // 注册插件
    app.use(i18n);
    app.use(VueViewer, {
      defaultOptions: {
        zIndex: 9999,
        title: false,
        toolbar: true,
        navbar: false,
        rotatable: false,
        loop: false,
      },
    });

    // 挂载应用
    app.mount('#app');

    // 应用挂载后的配置

    // 设置定期清理缓存（每小时清理一次）
    setupCacheCleanupScheduler();

    // 初始化禁止缩放
    disableZoom();

    // 禁止鼠标右键菜单
    if (process.env.NODE_ENV === 'production') disableContextMenu();

    // 启动检查，使用requestAnimationFrame
    requestAnimationFrame(checkAppReady);

    // 开发环境下的性能监控
    if (process.env.NODE_ENV === 'development') {
      try {
        // 添加性能监控模块
        const { monitorMemory, monitorCPU } = await import(
          './utils/performance'
        );
        monitorMemory();
        monitorCPU();
      } catch (error) {
        console.warn('无法初始化性能监控:', error);
      }
    }
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    // 显示错误信息给用户
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.padding = '20px';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    errorDiv.style.color = 'white';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.fontSize = '16px';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
      <p>应用初始化失败，请尝试刷新页面。</p>
      <p>错误详情: ${error instanceof Error ? error.message : String(error)}</p>
    `;
    document.body.appendChild(errorDiv);

    // 仍然尝试挂载应用，以显示错误UI
    const app = createApp(App);
    app.use(i18n);
    app.mount('#app');
  }
}

// 启动应用初始化序列
initializeApp();
