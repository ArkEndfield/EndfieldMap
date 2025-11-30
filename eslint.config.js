import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**']),
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactRefresh.configs.vite],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // 禁止使用 any
      '@typescript-eslint/no-explicit-any': 'error',
      // 导入排序
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
  eslintConfigPrettier,
]);
