import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(process.env.CNB_BUILD_ID || process.env.GITHUB_SHA || ''),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: ['consola', 'ol'],
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
    dts({
      include: ['src/**/*'],
      outDirs: 'dist',
      entryRoot: 'src',
      insertTypesEntry: true,
      cleanVueFileName: true,
      copyDtsFiles: false,
    }),
  ],
  resolve: {
    alias: {
      '@endfieldmap/tools': path.resolve(__dirname, './src'),
      '@endfieldmap/tools/*': path.resolve(__dirname, './src/*'),
    },
  },
});
