const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all workspace packages for changes
config.watchFolders = [monorepoRoot];

// Resolve modules from both project root and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// DEV-ONLY: Alias workspace packages to their source directories
// so changes are picked up immediately without a build step.
// In production builds (EAS Build / expo export), the packages
// are consumed via their built dist/ artifacts as usual because
// Metro resolves them through node_modules.
if (process.env.NODE_ENV !== 'production' && !process.env.EAS_BUILD) {
  const devAliases = {
    '@endfieldmap/map-adapter-maplibre': path.resolve(monorepoRoot, 'packages/map-adapter-maplibre/src'),
    '@endfieldmap/map-core': path.resolve(monorepoRoot, 'packages/map-core/src'),
    '@endfieldmap/map-service': path.resolve(monorepoRoot, 'packages/map-service/src'),
    '@endfieldmap/tools': path.resolve(monorepoRoot, 'packages/tools/src'),
    '@endfieldmap/storage-mmkv': path.resolve(monorepoRoot, 'packages/storage-mmkv/src'),
    '@endfieldmap/storage-expo-sqlite': path.resolve(monorepoRoot, 'packages/storage-expo-sqlite/src'),
    '@endfieldmap/map-hooks': path.resolve(monorepoRoot, 'packages/map-hooks/src'),
  };

  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    for (const [alias, target] of Object.entries(devAliases)) {
      if (moduleName === alias) {
        return context.resolveRequest(context, path.resolve(target, 'index.ts'), platform);
      }
      if (moduleName.startsWith(alias + '/')) {
        const rest = moduleName.slice(alias.length + 1);
        return context.resolveRequest(context, path.resolve(target, rest), platform);
      }
    }

    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

// 原生端 react 按 RN 渲染器版本精确钉住（pnpm catalog `native`），与 web / 共享包的默认 react 不同，
// 工作区共享包（map-hooks）因此解析到另一份 react-i18next 实例；这里强制从本应用解析，让共享 hooks 的
// useTranslation 与 initReactI18next / I18nextProvider 使用同一实例（react / react-dom 已由 Expo 的
// autolinking sticky resolution 去重）。
const appSingletons = ['react-i18next'];
const appOrigin = path.resolve(projectRoot, 'package.json');
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isAppSingleton = appSingletons.some((name) => moduleName === name || moduleName.startsWith(`${name}/`));
  const ctx = isAppSingleton ? { ...context, originModulePath: appOrigin } : context;
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(ctx, moduleName, platform);
  }
  return ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = withNativewind(config);
