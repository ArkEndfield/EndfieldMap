import type { AiModelInfo, AiProviderConfig } from '@endfieldmap/map-service/@types/ai';
import { AiLocalStorageKey } from '@endfieldmap/map-service/const/storage';
import { LocalStorageValue } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

export const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com/v1';
export const DEFAULT_AI_TEMPERATURE = 0.3;

/**
 * 把用户填的地址规整成可拼接的根地址：去掉尾部斜杠和误填的具体路径。
 *
 * 用户经常直接粘贴文档里的完整接口地址（`.../v1/chat/completions`），
 * 这里统一回退到 `/v1`，省掉一类「填了但连不上」的反馈。
 */
export function normalizeBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/, '').replace(/\/models$/, '');
  return url;
}

/**
 * AI 供应商配置。全部字段本机持久化，跨平台走 IStorageAdapter。
 */
export class AiConfigService {
  public readonly enabled = new LocalStorageValue<boolean>({
    initialValue: false,
    storageKey: AiLocalStorageKey.ENABLED,
  });
  public readonly baseUrl = new LocalStorageValue<string>({
    initialValue: DEFAULT_AI_BASE_URL,
    storageKey: AiLocalStorageKey.BASE_URL,
  });
  public readonly apiKey = new LocalStorageValue<string>({
    initialValue: '',
    storageKey: AiLocalStorageKey.API_KEY,
  });
  public readonly model = new LocalStorageValue<string>({
    initialValue: '',
    storageKey: AiLocalStorageKey.MODEL,
  });
  public readonly temperature = new LocalStorageValue<number>({
    initialValue: DEFAULT_AI_TEMPERATURE,
    storageKey: AiLocalStorageKey.TEMPERATURE,
  });

  /** 最近一次「测试连接」拉到的模型列表，仅内存态。 */
  @observable.ref accessor models: AiModelInfo[] = [];

  @computed
  public get config(): AiProviderConfig {
    return {
      baseUrl: normalizeBaseUrl(this.baseUrl.value),
      apiKey: this.apiKey.value.trim(),
      model: this.model.value.trim(),
      temperature: this.temperature.value,
    };
  }

  /** 地址与模型都填了才算可用（apiKey 允许为空，本地推理服务常常不校验）。 */
  @computed
  public get isConfigured(): boolean {
    const { baseUrl, model } = this.config;
    return baseUrl.length > 0 && model.length > 0;
  }

  @action
  public setModels(models: AiModelInfo[]): void {
    this.models = models;
    // 首次拉到列表且尚未选模型时，替用户选一个，省一步操作
    if (!this.model.value && models.length > 0) {
      this.model.value = models[0].id;
    }
  }

  public reset(): void {
    this.enabled.reset();
    this.baseUrl.reset();
    this.apiKey.reset();
    this.model.reset();
    this.temperature.reset();
    this.setModels([]);
  }
}
