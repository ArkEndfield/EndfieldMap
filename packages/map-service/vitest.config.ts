import path from 'node:path';

import { transformAsync } from '@babel/core';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@endfieldmap/map-service': path.resolve(__dirname, 'src') } },
  plugins: [
    {
      name: 'test-service-decorators',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.includes('/src/') || !id.endsWith('.ts') || !code.includes('@observable')) return;
        const result = await transformAsync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript'] },
          plugins: [
            ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
            '@babel/plugin-transform-class-properties',
            '@babel/plugin-transform-class-static-block',
          ],
          sourceMaps: true,
        });
        if (result?.code) return { code: result.code, map: result.map };
      },
    },
  ],
});
