/**
 * AI 助手相关类型。
 *
 * 供应商协议按 OpenAI Chat Completions 兼容层定义（DeepSeek / Moonshot / 硅基流动 /
 * Ollama / vLLM / OpenRouter 等都提供这套接口），因此只需要用户填 baseUrl + apiKey。
 */

/** 用户在前端自行配置的供应商信息。apiKey 只留在本机存储，不上行到本站后端。 */
export interface AiProviderConfig {
  /** OpenAI 兼容的接口根地址，例如 `https://api.deepseek.com/v1` */
  baseUrl: string;
  /** 供应商 API Key；留空表示走本地无鉴权服务（如 Ollama） */
  apiKey: string;
  /** 对话使用的模型 id */
  model: string;
  /** 采样温度 */
  temperature: number;
}

/** `GET {baseUrl}/models` 返回的单个模型。 */
export interface AiModelInfo {
  id: string;
  ownedBy?: string;
}

export type AiMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** 请求体里的一次工具调用（OpenAI function calling 形状）。 */
export interface AiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    /** JSON 字符串，模型生成，不保证合法 */
    arguments: string;
  };
}

/** 发往供应商的一条消息。 */
export interface AiChatMessage {
  role: AiMessageRole;
  content: string;
  /** assistant 消息可能带工具调用 */
  tool_calls?: AiToolCall[];
  /** tool 消息必须回指对应的 tool_call id */
  tool_call_id?: string;
  name?: string;
}

/** 一轮补全的结果。 */
export interface AiCompletion {
  content: string;
  toolCalls: AiToolCall[];
  finishReason?: string;
}

/** JSON Schema 片段（工具参数描述）。用最小可用子集，避免引入额外依赖。 */
export interface AiJsonSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: AiJsonSchema;
  properties?: Record<string, AiJsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

/** 工具声明（发给模型的部分）。 */
export interface AiToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: AiJsonSchema;
  };
}

/** 工具执行结果：`data` 会被 JSON 序列化后作为 tool 消息回给模型。 */
export interface AiToolResult {
  ok: boolean;
  /** 回给模型的结构化结果 */
  data: unknown;
  /** 给用户看的一行摘要（面板上折叠显示） */
  summary?: string;
}

/** 一个可被模型调用的工具。 */
export interface AiTool {
  schema: AiToolSchema;
  execute: (args: Record<string, unknown>) => Promise<AiToolResult> | AiToolResult;
}

/** 面板上渲染的一条记录（与发给供应商的消息不是一一对应）。 */
export interface AiDisplayMessage {
  id: string;
  role: Exclude<AiMessageRole, 'system'>;
  content: string;
  /** 工具消息展示用：工具名 + 摘要 */
  toolName?: string;
  toolSummary?: string;
  /** 出错的消息以警示样式渲染 */
  error?: boolean;
  createdAt: number;
}
