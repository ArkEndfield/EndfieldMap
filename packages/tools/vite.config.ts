import { execSync } from 'node:child_process';
import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

/** CI 变量缺失时（本地构建 / env 未透传）兜底取 git commit hash，避免退化成时间戳 */
function gitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(
      (process.env.CNB_COMMIT || process.env.CNB_BUILD_ID || process.env.GITHUB_SHA || gitCommitHash()).slice(0, 8)
    ),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
