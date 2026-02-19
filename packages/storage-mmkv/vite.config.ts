import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: (id) => {
        if (id.startsWith('\0')) return false;
        if (id.startsWith('.') || id.startsWith('/')) return false;
        if (id.startsWith('@endfieldmap/storage-mmkv')) return false;
        return true;
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
    alias: {
      '@endfieldmap/storage-mmkv': path.resolve(__dirname, './src'),
    },
  },
});
