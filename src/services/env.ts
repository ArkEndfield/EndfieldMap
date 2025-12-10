/**
 * 是否为开发环境
 */
export const isDev = import.meta.env.DEV;

/**
 * 资源地址host
 */
export const assetsHost = import.meta.env.VITE_ASSETS_HOST || '';

/**
 * 后端地址host
 */
export const backendHost = import.meta.env.VITE_BACKEND_HOST || '';

/**
 * sentry dsn
 */
export const sentryDsn = import.meta.env.VITE_SENTRY_DSN || '';
