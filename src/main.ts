import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import VueViewer from 'v-viewer';
import 'viewerjs/dist/viewer.css'; // 确保导入CSS
import './types/global.d';
import { checkAppReady } from './utils/check';
import { disableContextMenu, disableZoom } from './utils/device';
import i18n from './i18n';

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

// 初始化禁止缩放
disableZoom();

// 禁止鼠标右键菜单
if (process.env.NODE_ENV === 'production') disableContextMenu();

// 启动检查，使用requestAnimationFrame
requestAnimationFrame(checkAppReady);
