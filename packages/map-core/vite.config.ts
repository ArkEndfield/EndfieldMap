import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-core': path.resolve(__dirname, './src'),
  } as Record<string, string>;

  if (isDev) {
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
          // 将 ol 和所有子模块、@endfieldmap/tools 及其子模块标记为外部依赖
          return (
            id === 'ol' ||
            id.startsWith('ol/') ||
            id === '@endfieldmap/tools' ||
            id.startsWith('@endfieldmap/tools/') ||
            id.startsWith('rbush') ||
            id.startsWith('quickselect')
          );
        },
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
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
        outDirs: 'dist',
        entryRoot: 'src',
        insertTypesEntry: true,
        cleanVueFileName: true,
        copyDtsFiles: false,
        aliasesExclude: ['@endfieldmap/tools', '@endfieldmap/tools/*'],
      }),
    ],
    resolve: {
      alias: alias,
    },
  };
});
