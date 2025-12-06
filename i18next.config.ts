import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'zh-TW', 'es-MX', 'ru-RU'],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'public/locales/{{language}}/{{namespace}}.json',
    defaultNS: 'common',
  },
});
