import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import i18n from './i18n';
import './types/global.d';
import { checkAppReady } from './utils/check';
import { disableContextMenu, disableZoom } from './utils/device';

const app = createApp(App);
app.use(i18n);

// 挂载应用
app.mount('#app');

// 初始化禁止缩放
disableZoom();

// 禁止鼠标右键菜单
disableContextMenu();

// 启动检查，使用requestAnimationFrame
requestAnimationFrame(checkAppReady);
