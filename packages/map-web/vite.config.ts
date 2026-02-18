import { resolve } from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-core': resolve(__dirname, '../map-core/src'),
    '@endfieldmap/tools': resolve(__dirname, '../tools/src'),
    '@endfieldmap/map-service': resolve(__dirname, '../map-service/src'),
  };
  return {
    mode,
    command,
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.CNB_BUILD_ID || process.env.GITHUB_SHA || ''),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    appType: 'mpa',
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler'],
            ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-class-static-block'],
          ],
        },
      }),
      tailwindcss(),
      !!process.env.SENTRY_AUTH_TOKEN &&
        sentryVitePlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          url: process.env.SENTRY_URL,
          sourcemaps: {
            filesToDeleteAfterUpload: '**/*.js.map',
          },
        }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'locales/**/*.json', 'images/**/*.png', 'images/**/*.jpg', 'images/**/*.svg'],
        manifest: {
          name: '终末地地图资源查询 - ZMDMAP',
          short_name: 'ZMDMap',
          description: '终末地地图站, 一站式查询地图所有资源点位。Endfield Interactive Map.',
          theme_color: '#262626',
          icons: [
            {
              src: 'android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'ndroid-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        ...(isDev ? alias : {}),
        '@': resolve(__dirname, './src'),
        '@eftypes': resolve(__dirname, './src/@types'),
        '@themes': resolve(__dirname, './src/components/themes'),
      },
    },
    server: {
      allowedHosts: ['.cnb.run'],
    },
    build: {
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // RxJS
              if (id.includes('/rxjs/')) {
                return 'rxjs-vendor';
              }
              // RxDB 数据库
              if (id.includes('/rxdb/')) {
                return 'rxdb-vendor';
              }
              // TanStack DB
              if (id.includes('@tanstack/react-db') || id.includes('@tanstack/rxdb-db-collection')) {
                return 'tanstack-db-vendor';
              }
              // React 核心
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
                return 'react-vendor';
              }
              // 状态管理
              if (id.includes('/mobx/') || id.includes('/mobx-react-lite/')) {
                return 'state-vendor';
              }
              // 动画库
              if (id.includes('/motion/') || id.includes('/gsap/') || id.includes('@gsap')) {
                return 'ui-vendor';
              }
              // 国际化
              if (id.includes('/i18next/') || id.includes('/react-i18next/') || id.includes('i18next-')) {
                return 'i18n-vendor';
              }
              // OpenLayers 地图库
              if (id.includes('node_modules/ol/') || id.includes('node_modules/ol-')) {
                return 'map-vendor';
              }
              // Swiper 轮播
              if (id.includes('/swiper/')) {
                return 'swiper-vendor';
              }
              // Sentry 监控
              if (id.includes('@sentry/')) {
                return 'sentry-vendor';
              }
              // 图片查看器
              if (id.includes('yet-another-react-lightbox')) {
                return 'lightbox-vendor';
              }
            }
          },
        },
      },
    },
  };
});
