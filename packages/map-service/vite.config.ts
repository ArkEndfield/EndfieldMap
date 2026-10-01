import babel from '@rolldown/plugin-babel';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-service': path.resolve(__dirname, './src'),
  } as Record<string, string>;

  if (isDev) {
    alias['@endfieldmap/map-core'] = path.resolve(__dirname, '../map-core/src');
    alias['@endfieldmap/tools'] = path.resolve(__dirname, '../tools/src');
  }

  return {
    build: {
      lib: {
        entry: {
          index: path.resolve(__dirname, 'src/index.ts'),
          'locales/bundled': path.resolve(__dirname, 'src/locales/bundled.ts'),
        },
        formats: ['es'],
      },
      rolldownOptions: {
        external: (id) => {
          if (id.startsWith('\0')) return false;
          if (path.isAbsolute(id)) return false;
          if (id.startsWith('.')) return false;
          if (id.startsWith('@endfieldmap/map-service')) return false;
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
      // 服务类里大量 @observable/@computed/@action 装饰器（user/sync/preset 等），
      // 库构建期必须转译——vite 8 / rolldown 只解析不降级，漏挂会把装饰器语法
      // 原样带进 dist。与其余库包保持同一插件三元组。
      babel({
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-class-static-block'],
        ],
      }),
      dts({
        include: ['src/**/*.ts'],
        tsconfigPath: 'tsconfig.build.json',
        outDirs: 'dist',
        entryRoot: 'src',
        insertTypesEntry: true,
        cleanVueFileName: true,
        copyDtsFiles: true,
        aliasesExclude: ['@endfieldmap/map-core', '@endfieldmap/map-core/*', '@endfieldmap/tools', '@endfieldmap/tools/*'],
        exclude: ['@endfieldmap/map-core', '@endfieldmap/map-core/*', '@endfieldmap/tools', '@endfieldmap/tools/*'],
      }),
    ],
    resolve: {
      alias: alias,
    },
  };
});
