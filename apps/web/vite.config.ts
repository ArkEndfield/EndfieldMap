import { readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function removeSourceMaps(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      removeSourceMaps(fullPath);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.map')) {
      rmSync(fullPath);
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const sentryEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);
  const alias = {
    '@endfieldmap/map-adapter-ol': resolve(__dirname, '../../packages/map-adapter-ol/src'),
    '@endfieldmap/map-core': resolve(__dirname, '../../packages/map-core/src'),
    '@endfieldmap/tools': resolve(__dirname, '../../packages/tools/src'),
    '@endfieldmap/map-service': resolve(__dirname, '../../packages/map-service/src'),
    '@endfieldmap/storage-web': resolve(__dirname, '../../packages/storage-web/src'),
    '@endfieldmap/map-web-theme-types': resolve(__dirname, '../../packages/map-web-theme-types/src'),
    '@endfieldmap/web-components': resolve(__dirname, '../../packages/web-components/src'),
    '@endfieldmap/map-hooks': resolve(__dirname, '../../packages/map-hooks/src'),
  };
  return {
    mode,
    command,
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.CNB_BUILD_ID || process.env.GITHUB_SHA || ''),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
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
      sentryEnabled &&
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
        workbox: {
          sourcemap: false,
          navigateFallbackDenylist: [/^\/docs/],
        },
        includeAssets: ['favicon.ico', 'locales/**/*.json'],
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
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
      sentryEnabled && {
        name: 'cleanup-residual-sourcemaps',
        closeBundle() {
          removeSourceMaps(resolve(__dirname, 'dist'));
        },
      },
    ],
    resolve: {
      alias: {
        ...(mode === 'development' ? alias : {}),
        '@': resolve(__dirname, './src'),
        '@eftypes': resolve(__dirname, './src/@types'),
        '@themes': resolve(__dirname, './src/components/themes'),
      },
    },
    server: {
      allowedHosts: ['.cnb.run'],
    },
    build: {
      sourcemap: sentryEnabled ? 'hidden' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 多语种 JSON 按 locale 分包，每个 locale 一份 chunk，
            // 命名稳定便于 PWA 缓存与单独失效（仅该 locale 修改才让 chunk hash 变）
            const localeMatch = id.match(/\/locales\/([^/]+)\/[^/]+\.json$/);
            if (localeMatch) return `lang-${localeMatch[1]}`;

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
              // Sentry 监控（必须在 /react/ 规则之前，否则 @sentry/react 会被错误归类）
              if (id.includes('@sentry/')) {
                return 'sentry-vendor';
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
