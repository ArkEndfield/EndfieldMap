import { resolve } from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-core': resolve(__dirname, './packages/map-core/src'),
    '@endfieldmap/tools': resolve(__dirname, './packages/tools/src'),
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
    ],
    resolve: {
      alias: {
        ...(isDev ? alias : {}),
        '@': resolve(__dirname, './src'),
        '@eftypes': resolve(__dirname, './src/@types'),
        '@themes': resolve(__dirname, './src/components/themes'),
      },
    },
    build: {
      sourcemap: 'hidden',
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/react/') || id.includes('/react-dom/')) {
                return 'react-vendor';
              }
              if (id.includes('/mobx/') || id.includes('/mobx-react-lite/')) {
                return 'state-vendor';
              }
              if (id.includes('/motion/') || id.includes('/gsap/') || id.includes('@gsap')) {
                return 'ui-vendor';
              }
              if (id.includes('/i18next/') || id.includes('/react-i18next/') || id.includes('i18next-')) {
                return 'i18n-vendor';
              }
              if (id.includes('/ol/')) {
                return 'map-vendor';
              }
            }
          },
        },
      },
    },
  };
});
