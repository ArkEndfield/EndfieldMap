import react from '@vitejs/plugin-react';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-adapter-maplibre': path.resolve(__dirname, './src'),
  } as Record<string, string>;

  if (isDev) {
    alias['@endfieldmap/map-core'] = path.resolve(__dirname, '../map-core/src');
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
          if (id.startsWith('@endfieldmap/map-adapter-maplibre')) return false;
          if (id.startsWith('@endfieldmap/map-core')) return true;
          if (id.startsWith('@endfieldmap/tools')) return true;
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
          '@endfieldmap/tools', '@endfieldmap/tools/*',
          '@endfieldmap/map-core', '@endfieldmap/map-core/*',
        ],
        exclude: [
          '@endfieldmap/tools', '@endfieldmap/tools/*',
          '@endfieldmap/map-core', '@endfieldmap/map-core/*',
        ],
      }),
    ],
    resolve: {
      alias: alias,
    },
  };
});
