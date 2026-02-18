import path from 'path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const alias = {
    '@endfieldmap/map-service': path.resolve(__dirname, './src'),
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
          if (id.startsWith('\0')) return false;
          if (path.isAbsolute(id)) return false;
          if (id.startsWith('.')) return false;
          if (id.startsWith('@endfieldmap/map-service')) return false;
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
      alias: alias,
    },
  };
});
