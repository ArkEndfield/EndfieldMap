import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import MotionResolver from 'motion-v/resolver';
import Components from 'unplugin-vue-components/vite';
import resourceLoadingPlugin from './vite-plugin-resource-loading';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    resourceLoadingPlugin({
      simulateLoadingInDev: true,
      minLoadingTime: 500, // 增加最小加载时间，确保过渡效果更平滑
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
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
        entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
        assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
        experimentalMinChunkSize: 10 * 1024, // 单位b 没有副作用，合并较小的模块
        manualChunks(id) {
          if (id.includes('/lodash')) {
            return 'lodash';
          } else if (id.includes('/@vue')) {
            return 'vue-use';
          } else if (id.includes('/leaflet/')) {
            return 'veleafletndor';
          } else if (id.includes('/ol/')) {
            return 'ol';
          } else if (id.includes('/node_modules/')) {
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
});
