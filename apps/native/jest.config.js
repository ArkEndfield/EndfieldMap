/**
 * Expo 应用测试预设。pnpm 的 .pnpm 存储路径会让单一 node_modules allowlist
 * 失效（node_modules/ 后面先出现 .pnpm/），因此用双模式分别放行存储内外的
 * RN/Expo/工作区 ESM 包。
 */
const allow =
  '((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-reanimated|mobx-react-lite|@endfieldmap/.*|nativewind)';

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // 工作区包的 exports 只声明了 import 条件（Metro 可解析），jest 的
    // CJS 解析需显式映射到源码；源码在 transformIgnorePatterns 白名单内。
    '^@endfieldmap/map-core$': '<rootDir>/../../packages/map-core/src/index.ts',
    '^@endfieldmap/map-core/(.*)$': '<rootDir>/../../packages/map-core/src/$1',
    '^@endfieldmap/map-service$': '<rootDir>/../../packages/map-service/src/index.ts',
    '^@endfieldmap/map-service/(.*)$': '<rootDir>/../../packages/map-service/src/$1',
    '^@endfieldmap/tools$': '<rootDir>/../../packages/tools/src/index.ts',
    '^@endfieldmap/tools/(.*)$': '<rootDir>/../../packages/tools/src/$1',
  },
  transformIgnorePatterns: [
    `node_modules/(?!\\.pnpm/|${allow})`,
    `\\.pnpm/(?!${allow})`,
  ],
};
