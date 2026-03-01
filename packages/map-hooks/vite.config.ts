import react from '@vitejs/plugin-react';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-hooks': path.resolve(__dirname, './src'),
  } as Record<string, string>;

  if (isDev) {
    alias['@endfieldmap/map-core'] = path.resolve(__dirname, '../map-core/src');
    alias['@endfieldmap/map-service'] = path.resolve(__dirname, '../map-service/src');
    alias['@endfieldmap/tools'] = path.resolve(__dirname, '../tools/src');
  }

  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index',
      },
      rolldownOptions: {
        external: (id) => {
          if (id.startsWith('\0')) return false;
          if (path.isAbsolute(id)) return false;
          if (id.startsWith('.')) return false;
          if (id.startsWith('@endfieldmap/map-hooks')) return false;
          // treat all other workspace packages and node_modules as external for lib build
          return true;
        },
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          exports: 'named',
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    plugins: [
      react({
        babel: {
          plugins: [
            ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-class-static-block'],
          ],
        },
      }),
      dts({
        include: ['src/**/*'],
        tsconfigPath: 'tsconfig.build.json',
        outDirs: 'dist',
        entryRoot: 'src',
        insertTypesEntry: true,
        cleanVueFileName: true,
        copyDtsFiles: true,
        aliasesExclude: [
          '@endfieldmap/map-core',
          '@endfieldmap/map-core/*',
          '@endfieldmap/map-service',
          '@endfieldmap/map-service/*',
          '@endfieldmap/tools',
          '@endfieldmap/tools/*',
        ],
        exclude: [
          '@endfieldmap/map-core',
          '@endfieldmap/map-core/*',
          '@endfieldmap/map-service',
          '@endfieldmap/map-service/*',
          '@endfieldmap/tools',
          '@endfieldmap/tools/*',
        ],
      }),
    ],
    resolve: {
      alias: alias,
    },
  };
});
