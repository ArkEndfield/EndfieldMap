import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    'zh-CN',
    'de-DE',
    'en-US',
    'es-MX',
    'fr-FR',
    'id-ID',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'pt-BR',
    'ru-RU',
    'th-TH',
    'vi-VN',
    'zh-TW',
  ],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultNS: 'common',
  },
});
