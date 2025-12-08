import { resolve } from 'node:path';

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
    appType: 'mpa',
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler'],
            ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            ['@babel/plugin-transform-class-static-block'],
          ],
        },
      }),
      tailwindcss(),
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
