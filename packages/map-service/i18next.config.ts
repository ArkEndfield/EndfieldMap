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
  types: {
    // 必须显式指向 locale JSON：本包里几乎没有 `t()` 调用（业务文案都在 apps/*
    // 里用，这里只做资源与类型的托管），不指定 input 时 `types` 会走源码提取，
    // 提取到 0 个 key，直接把 resources.d.ts 清空。
    input: ['src/locales/zh-CN/*.json'],
    basePath: 'src/locales/zh-CN',
    output: 'src/@types/i18next.d.ts',
    resourcesFile: 'src/@types/resources.d.ts',
    enableSelector: false,
  },
});
