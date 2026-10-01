import type { AiModelInfo } from '@endfieldmap/map-service/@types/ai';
import type { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import { AiAssistantService } from '@endfieldmap/map-service/service/ai/assistant';
import { AiClient } from '@endfieldmap/map-service/service/ai/client';
import { AiConfigService } from '@endfieldmap/map-service/service/ai/config';
import type { MapDataService } from '@endfieldmap/map-service/service/data/map';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import type { LangHashService } from '@endfieldmap/map-service/service/lang_hash';

export interface AiServiceDeps<T, R> {
  adapterRegistry: AdapterRegistry;
  mapDataService: MapDataService<T, R>;
  i18nService: I18nService;
  langHashService: LangHashService;
}

/**
 * AI 助手服务门面：配置 + 供应商客户端 + 会话。
 *
 * 供应商由用户自己填（baseUrl / apiKey / model），请求从浏览器直连过去，
 * 本站后端全程不参与，也拿不到 Key。
 */
export class AiService<T, R> {
  public readonly config = new AiConfigService();
  public readonly client = new AiClient();
  public readonly assistant: AiAssistantService<T, R>;

  constructor(deps: AiServiceDeps<T, R>) {
    this.assistant = new AiAssistantService({
      ...deps,
      configService: this.config,
      client: this.client,
    });
  }

  /** 测试连接并拉取模型列表；成功后写入配置服务供下拉框使用。 */
  public async refreshModels(): Promise<AiModelInfo[]> {
    const models = await this.client.listModels(this.config.config);
    this.config.setModels(models);
    return models;
  }
}
