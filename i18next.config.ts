import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    "cn",
    "tc",
    "en",
    "ja",
    "kr"
  ],
  extract: {
    input: "src/**/*.{js,jsx,ts,tsx}",
    output: "public/locales/{{language}}/{{namespace}}.json"
  }
});