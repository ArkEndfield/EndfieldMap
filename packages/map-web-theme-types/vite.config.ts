import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: [
        path.resolve(__dirname, 'src/index.ts'),
        path.resolve(__dirname, 'src/alert.ts'),
        path.resolve(__dirname, 'src/audio.ts'),
        path.resolve(__dirname, 'src/context.ts'),
        path.resolve(__dirname, 'src/dialog.ts'),
        path.resolve(__dirname, 'src/input.ts'),
        path.resolve(__dirname, 'src/tooltip.ts'),
      ],
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => {
        if (id.startsWith('\0')) return false;
        if (id.startsWith('.') || id.startsWith('/')) return false;
        if (id.startsWith('@endfieldmap/map-web-theme-types')) return false;
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
    sourcemap: false,
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      tsconfigPath: 'tsconfig.json',
      outDirs: 'dist',
      entryRoot: 'src',
      insertTypesEntry: true,
      cleanVueFileName: true,
      copyDtsFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@endfieldmap/map-web-theme-types': path.resolve(__dirname, './src'),
    },
  },
});
