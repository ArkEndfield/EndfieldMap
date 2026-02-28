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
      dts({
        include: ['src/**/*'],
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
