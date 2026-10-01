import type {
  AiChatMessage,
  AiCompletion,
  AiModelInfo,
  AiProviderConfig,
  AiToolCall,
  AiToolSchema,
} from '@endfieldmap/map-service/@types/ai';
import { normalizeBaseUrl } from '@endfieldmap/map-service/service/ai/config';

/** 拉模型列表的超时。供应商冷启动可能偏慢，但 20s 之后基本可以判定填错了。 */
const MODELS_TIMEOUT_MS = 20_000;

interface ModelsResponseItem {
  id?: string;
  /** Ollama 等实现用 name 而不是 id */
  name?: string;
  owned_by?: string;
}

interface ModelsResponse {
  data?: ModelsResponseItem[];
  /** 部分实现把列表放在 models 字段下 */
  models?: ModelsResponseItem[];
}

interface ChatChoiceMessage {
  content?: string | null;
  tool_calls?: AiToolCall[];
}

interface ChatDeltaToolCall {
  index?: number;
  id?: string;
  type?: 'function';
  function?: { name?: string; arguments?: string };
}

interface ChatChoiceDelta {
  content?: string | null;
  tool_calls?: ChatDeltaToolCall[];
}

interface ChatResponse {
  choices?: Array<{
    message?: ChatChoiceMessage;
    delta?: ChatChoiceDelta;
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

export interface ChatRequestOptions {
  messages: AiChatMessage[];
  tools?: AiToolSchema[];
  signal?: AbortSignal;
  /** 增量文本回调；供应商不支持流式时不会被调用 */
  onDelta?: (text: string) => void;
}

function authHeaders(config: AiProviderConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
}

/** 供应商的错误体格式五花八门，尽量掏出一句人话，掏不到就退回 HTTP 状态。 */
async function readErrorMessage(response: Response): Promise<string> {
  let detail: string;
  try {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      detail = parsed.error?.message || parsed.message || text;
    } catch {
      detail = text;
    }
  } catch {
    detail = '';
  }
  const trimmed = detail.trim().slice(0, 300);
  return trimmed ? `HTTP ${response.status}: ${trimmed}` : `HTTP ${response.status}`;
}

/** 按 index 累积流式 tool_call 分片（名称和参数都是逐段吐出来的）。 */
function mergeToolCallDeltas(acc: Map<number, AiToolCall>, deltas: ChatDeltaToolCall[]): void {
  deltas.forEach((delta, fallbackIndex) => {
    const index = delta.index ?? fallbackIndex;
    const current = acc.get(index) ?? { id: '', type: 'function' as const, function: { name: '', arguments: '' } };
    acc.set(index, {
      id: delta.id || current.id,
      type: 'function',
      function: {
        name: delta.function?.name || current.function.name,
        arguments: current.function.arguments + (delta.function?.arguments ?? ''),
      },
    });
  });
}

/**
 * OpenAI Chat Completions 兼容客户端。
 *
 * 请求直连用户填写的 baseUrl，不经过本站 ServerService —— 那条链路带着本站
 * token 与 401 刷新队列，第三方地址既用不上也不该拿到。
 */
export class AiClient {
  /** 拉取模型列表，同时充当「测试连接」。 */
  public async listModels(config: AiProviderConfig): Promise<AiModelInfo[]> {
    const baseUrl = normalizeBaseUrl(config.baseUrl);
    if (!baseUrl) {
      throw new Error('baseUrl is empty');
    }
    const signal =
      typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(MODELS_TIMEOUT_MS)
        : undefined;

    const response = await fetch(`${baseUrl}/models`, { method: 'GET', headers: authHeaders(config), signal });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const body = (await response.json()) as ModelsResponse;
    const list = body.data ?? body.models ?? [];
    return list
      .map((item) => ({ id: item.id ?? item.name ?? '', ownedBy: item.owned_by }))
      .filter((item) => item.id.length > 0);
  }

  /**
   * 发起一轮补全。优先走流式（首字更快），环境不支持 ReadableStream 时
   * 自动退回整包解析。
   */
  public async chat(config: AiProviderConfig, options: ChatRequestOptions): Promise<AiCompletion> {
    const baseUrl = normalizeBaseUrl(config.baseUrl);
    if (!baseUrl) {
      throw new Error('baseUrl is empty');
    }
    const wantStream = !!options.onDelta;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: authHeaders(config),
      signal: options.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        messages: options.messages,
        stream: wantStream,
        ...(options.tools?.length ? { tools: options.tools, tool_choice: 'auto' } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    if (wantStream && response.body) {
      return this.readStream(response.body, options.onDelta);
    }
    return this.readWhole(response);
  }

  private async readWhole(response: Response): Promise<AiCompletion> {
    const body = (await response.json()) as ChatResponse;
    if (body.error?.message) {
      throw new Error(body.error.message);
    }
    const choice = body.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
      toolCalls: choice?.message?.tool_calls ?? [],
      finishReason: choice?.finish_reason ?? undefined,
    };
  }

  private async readStream(body: ReadableStream<Uint8Array>, onDelta?: (text: string) => void): Promise<AiCompletion> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const toolCalls = new Map<number, AiToolCall>();
    let content = '';
    let finishReason: string | undefined;
    let buffer = '';

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 以空行分事件；最后一段可能不完整，留在 buffer 里等下一块。
        // 个别代理/供应商输出 CRLF 行尾，分隔符按可选 \r 匹配，否则整个事件
        // 永远切不开、尾行 JSON 解析失败被当心跳跳过——分片内容就丢了。
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';

        for (const event of events) {
          for (const line of event.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;

            let chunk: ChatResponse;
            try {
              chunk = JSON.parse(payload) as ChatResponse;
            } catch {
              // 心跳/注释行，跳过
              continue;
            }
            if (chunk.error?.message) {
              throw new Error(chunk.error.message);
            }
            const choice = chunk.choices?.[0];
            if (!choice) continue;
            const text = choice.delta?.content;
            if (text) {
              content += text;
              onDelta?.(text);
            }
            if (choice.delta?.tool_calls?.length) {
              mergeToolCallDeltas(toolCalls, choice.delta.tool_calls);
            }
            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content,
      toolCalls: [...toolCalls.entries()].sort((a, b) => a[0] - b[0]).map(([, call]) => call),
      finishReason,
    };
  }
}
