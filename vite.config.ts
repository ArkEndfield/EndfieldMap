import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import MotionResolver from 'motion-v/resolver';
import Components from 'unplugin-vue-components/vite';
import resourceLoadingPlugin from './vite-plugin-resource-loading';
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'prod';
  return {
    plugins: [
      vue(),
      resourceLoadingPlugin({
        simulateLoadingInDev: !isProd,
        minLoadingTime: isProd ? 0 : 500, // 生产环境下减少加载延迟
      }),
      tailwindcss(),
      AutoImport({
        imports: ['vue'],
      }),
      Components({
        resolvers: [NaiveUiResolver(), MotionResolver()],
      }),
    ],
    build: {
      target: 'es2015',
      minify: 'esbuild',
      sourcemap: false,
      cssTarget: 'chrome80',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      // 提高构建性能配置
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4KB以下的资源内联为base64
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
          entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
          assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
          experimentalMinChunkSize: 20 * 1024, // 提高到20KB，更积极地合并小模块
          manualChunks(id) {
            if (id.includes('/lodash')) {
              return 'lodash';
            } else if (id.includes('/@vue')) {
              return 'vue-core';
            } else if (id.includes('/leaflet/')) {
              return 'leaflet-vendor';
            } else if (id.includes('/ol/')) {
              return 'ol-core'; // 改名以避免与变量同名
            } else if (id.includes('/node_modules/')) {
              // 更细粒度地拆分vendor包
              if (id.includes('/node_modules/vue-i18n/')) {
                return 'i18n-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // 优化开发服务器配置
    server: {
      hmr: {
        // 限制HMR更新频率，降低开发时CPU负载
        overlay: false,
      },
      watch: {
        // 优化文件监视设置
        usePolling: false,
        interval: 1000,
      },
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ['vue', 'ol', 'leaflet'],
    },
  };
});
