import babel from '@rolldown/plugin-babel';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

// 不 define __COMMIT_HASH__/__BUILD_TIME__：保留裸标识符到 dist，由消费方（apps/web 的
// define）在应用构建期替换。在包构建期烤入会让 tools 产物随 commit 变化，击穿整条
// turbo 缓存链；无 define 的环境（native/Metro）靠 runtime.ts 的 typeof 守卫兜底。
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      // 排除所有 dependencies 和 peerDependencies
      external: (id) => {
        // Rollup 虚拟模块不排除
        if (id.startsWith('\0')) return false;
        // 本地相对路径不排除
        if (id.startsWith('.') || id.startsWith('/')) return false;
        // 别名解析后的绝对路径不排除（Windows 盘符路径不以 / 开头，需单独判断）
        if (path.isAbsolute(id)) return false;
        // 包内别名不排除
        if (id.startsWith('@endfieldmap/tools/')) return false;
        // node_modules 中的所有包都排除
        return /^[^./]/.test(id);
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  plugins: [
    // 2023-11 装饰器（LocalStorageValue 的 @observable/@computed/@action）必须
    // 在库构建期转译：vite 8 / rolldown 只解析不降级装饰器语法，漏挂这个插件
    // 会让 dist 原样带出 `@r accessor`，Node 与浏览器都无法解析。与其余库包
    // （map-core / map-adapter-ol 等）的插件三元组保持一致。
    babel({
      plugins: [
        ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-class-static-block'],
      ],
    }),
    dts({
      include: ['src/**/*'],
      outDirs: 'dist',
      entryRoot: 'src',
      insertTypesEntry: true,
      cleanVueFileName: true,
      copyDtsFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@endfieldmap/tools': path.resolve(__dirname, './src'),
      '@endfieldmap/tools/*': path.resolve(__dirname, './src/*'),
    },
  },
});
