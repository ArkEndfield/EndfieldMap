import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), AutoImport({
    imports: [
      'vue',
      {
        'naive-ui': [
          'useDialog',
          'useMessage',
          'useNotification',
          'useLoadingBar'
        ]
      }
    ]
  }),
  Components({
    resolvers: [NaiveUiResolver()]
  })],
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const paths = id.toString().split('node_modules/')
            if (paths[2]) {
              return paths[2].split('/')[0].toString()
            }
            return paths[1].split('/')[0].toString()
          }
        },
      },
    },
  },
})
