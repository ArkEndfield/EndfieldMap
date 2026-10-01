export enum UserLocalStorageKey {
  TOKEN = 'userToken',
  CURRENT_UID = 'currentUid',
  DATABASE_SCOPE = 'userDatabaseScope',
  /** 本机出现过的角色库范围登记（「清除储存数据」全量删库用） */
  KNOWN_DB_SCOPES = 'userKnownDbScopes',
}

/**
 * AI 助手配置。全部只落本机存储（Web 走 localStorage，原生走 MMKV），
 * 其中 API Key 永远不会随任何请求发往本站后端。
 */
export enum AiLocalStorageKey {
  ENABLED = 'ai_enabled',
  BASE_URL = 'ai_base_url',
  API_KEY = 'ai_api_key',
  MODEL = 'ai_model',
  TEMPERATURE = 'ai_temperature',
}
