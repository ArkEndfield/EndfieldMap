import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import i18n from './i18n';

const app = createApp(App);
app.use(i18n);

// 挂载应用
app.mount('#app');

// 使用更可靠的方式检测应用准备好
const checkAppReady = () => {
  // 获取应用根元素
  const appRoot = document.getElementById('app');

  // 检查是否有内容
  if (appRoot && appRoot.children && appRoot.children.length > 0) {
    // 使用RAF确保在合适的渲染时机执行加载完成通知
    const preloadResources = () => {
      // 优先检查关键元素是否存在并可见
      const mainContent =
        appRoot.querySelector('.main-content') ||
        appRoot.querySelector('main') ||
        appRoot.querySelector('.container');

      if (mainContent) {
        // 主要内容已渲染，进行图片预加载检查
        checkImagesLoaded();
      } else {
        // 如果主要内容还没渲染完成，等待下一帧
        requestAnimationFrame(preloadResources);
      }
    };

    const checkImagesLoaded = () => {
      // 关键图片资源检查
      const appImages = appRoot.querySelectorAll('img');
      let loadedImages = 0;
      const totalImages = Math.min(3, appImages.length); // 只等待前3张关键图片

      if (totalImages === 0) {
        // 没有图片需要预加载，立即通知应用已准备好
        notifyAppLoaded();
        return;
      }

      // 添加安全超时机制，使用requestAnimationFrame而不是setTimeout
      let frameCount = 0;
      const maxFrames = 60; // 约1秒(60帧)

      const checkFrame = () => {
        if (loadedImages >= totalImages || frameCount >= maxFrames) {
          notifyAppLoaded();
          return;
        }

        frameCount++;
        requestAnimationFrame(checkFrame);
      };

      // 开始帧检查
      requestAnimationFrame(checkFrame);

      // 检查图片加载状态
      for (let i = 0; i < totalImages; i++) {
        const img = appImages[i];
        if (img.complete) {
          loadedImages++;
        } else {
          img.onload = img.onerror = () => {
            loadedImages++;
          };
        }
      }
    };

    const notifyAppLoaded = () => {
      // 确保只通知一次
      if (window.APP_LOADED && !window.APP_LOADED_CALLED) {
        window.APP_LOADED_CALLED = true;
        // 使用requestAnimationFrame确保在下一帧渲染时发出通知
        requestAnimationFrame(() => {
          window.APP_LOADED?.();
          // 触发自定义事件
          window.dispatchEvent(new CustomEvent('app-content-ready'));
        });
      }
    };

    // 开始预加载检查
    requestAnimationFrame(preloadResources);
  } else {
    // 如果还没有内容渲染，使用requestAnimationFrame等待
    requestAnimationFrame(checkAppReady);
  }
};

// 启动检查，使用requestAnimationFrame
requestAnimationFrame(checkAppReady);

// 为TypeScript声明全局变量
declare global {
  interface Window {
    APP_LOADED?: () => void;
    APP_LOADED_CALLED?: boolean;
  }
}
