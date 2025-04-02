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

// 初始化存储系统
initStorageSystem().catch(error => {
  console.error('初始化存储系统失败:', error);
});

if (process.env.NODE_ENV === 'development') {
  try {
    // 添加性能监控模块
    const { monitorMemory } = await import('./utils/performance');
    monitorMemory();
  } catch (error) {}
}
const app = createApp(App);

// 再注册VueViewer
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

// 先注册i18n
app.use(i18n);

// 挂载应用
app.mount('#app');

// 设置定期清理缓存（每小时清理一次）
setupCacheCleanupScheduler();

// 初始化禁止缩放
disableZoom();

// 禁止鼠标右键菜单
if (process.env.NODE_ENV === 'production') disableContextMenu();

// 启动检查，使用requestAnimationFrame
requestAnimationFrame(checkAppReady);
