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
