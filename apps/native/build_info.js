// 构建期身份注入：与 web 端 vite.config.ts 的 define(__COMMIT_HASH__/__BUILD_TIME__) 对齐。
// 必须是 index.js 的首个 import：Metro/babel 的 CJS 转换按序执行 require，
// 保证任何模块（tools/utils/runtime.ts 的 getVersionInfo）求值前全局已就绪。
// EXPO_PUBLIC_* 由 babel-preset-expo 在构建时内联，EAS 构建可注入
// EXPO_PUBLIC_COMMIT_HASH / EXPO_PUBLIC_BUILD_TIME；缺省回退到稳定常量，
// 使同一构建的版本门控跨启动保持命中（不再每次启动全量重下载静态数据）。
global.__COMMIT_HASH__ = process.env.EXPO_PUBLIC_COMMIT_HASH || 'native-dev';
global.__BUILD_TIME__ = process.env.EXPO_PUBLIC_BUILD_TIME || 'native-dev';
