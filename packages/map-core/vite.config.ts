import react from '@vitejs/plugin-react';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

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
          // 排除所有 node_modules 中的依赖（包括 ol, mobx 等）
          // 但保留相对路径导入的本地模块
          if (id.startsWith('\0')) return false; // Rollup 虚拟模块
          if (path.isAbsolute(id)) return false; // 绝对路径是本地文件
          if (id.startsWith('.')) return false; // 相对路径是本地文件
          if (id.startsWith('@endfieldmap/map-core')) return false; // 当前包的内部导入
          if (id.startsWith('@endfieldmap/tools')) return true; // workspace 依赖
          if (id.startsWith('rbush') || id.startsWith('quickselect')) return true; // ol 的可选依赖
          // 其他 node_modules 依赖都视为 external
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
        copyDtsFiles: false,
        aliasesExclude: ['@endfieldmap/tools', '@endfieldmap/tools/*'],
        exclude: ['@endfieldmap/tools', '@endfieldmap/tools/*'],
      }),
    ],
    resolve: {
      alias: alias,
    },
  };
});
