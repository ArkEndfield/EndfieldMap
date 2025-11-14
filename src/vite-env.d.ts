interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_ASSETS_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
