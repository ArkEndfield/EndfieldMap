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
  },
  transformIgnorePatterns: [
    `node_modules/(?!\\.pnpm/|${allow})`,
    `\\.pnpm/(?!${allow})`,
  ],
};
