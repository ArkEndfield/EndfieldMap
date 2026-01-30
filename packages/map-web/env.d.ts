/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __COMMIT_HASH__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

interface ImportMetaEnv {
  readonly VITE_SYNC_SERVER_URL?: string;
}
