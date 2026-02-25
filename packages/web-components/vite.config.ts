import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

// 开发环境下指向其他子包源码，方便联调
const devAlias = {
  '@endfieldmap/map-service': path.resolve(__dirname, '../map-service/src'),
  '@endfieldmap/map-web-theme-types': path.resolve(__dirname, '../map-web-theme-types/src'),
  '@endfieldmap/tools': path.resolve(__dirname, '../tools/src'),
};

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else if (entry.isFile() && /\.(png|jpg|svg|webp)$/i.test(entry.name)) copyFileSync(srcPath, destPath);
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler'],
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-class-static-block'],
        ],
      },
    }),
    tailwindcss(),
    dts({
      include: ['src/**/*'],
      tsconfigPath: 'tsconfig.app.json',
      outDirs: 'dist',
      entryRoot: 'src',
      insertTypesEntry: true,
      cleanVueFileName: true,
      copyDtsFiles: true,
      aliasesExclude: ['@endfieldmap/web-components/assets', '@endfieldmap/web-components/assets/*'],
      exclude: ['**/*.stories.tsx'],
    }),
    {
      name: 'copy-assets',
      closeBundle() {
        copyDir(path.resolve(__dirname, 'src/assets'), path.resolve(__dirname, 'dist/assets'));
      },
    },
  ],
  resolve: {
    alias: {
      ...(mode === 'development' ? devAlias : {}),
      '@endfieldmap/web-components': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    cssCodeSplit: false,
    // 图片输出为独立文件，消费者打包时会解析 node_modules 中的资源
    assetsInlineLimit: 0,
    rolldownOptions: {
      external: (id) => {
        if (id.startsWith('\0')) return false;
        if (id.startsWith('.') || id.startsWith('/')) return false;
        // 资源作为 external，消费者 bundler 会解析并处理
        if (id.startsWith('@endfieldmap/web-components/assets/')) return true;
        if (id.startsWith('@endfieldmap/web-components')) return false;
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
}));
