import type { AiChatMessage, AiDisplayMessage, AiToolCall, AiToolResult } from '@endfieldmap/map-service/@types/ai';
import type { AiClient } from '@endfieldmap/map-service/service/ai/client';
import type { AiConfigService } from '@endfieldmap/map-service/service/ai/config';
import type { AiToolContext } from '@endfieldmap/map-service/service/ai/tools';
import { AiToolset } from '@endfieldmap/map-service/service/ai/tools';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

/** 单次提问里最多允许模型连续调多少轮工具，防止工具循环把额度烧光。 */
const MAX_TOOL_ROUNDS = 6;
/** 回给模型的工具结果长度上限；超长结果会被截断并提示模型收窄查询。 */
const MAX_TOOL_RESULT_CHARS = 12_000;
/** 发给供应商的上下文条数上限（不含 system），超出后按轮丢弃最早的对话。 */
const MAX_HISTORY_MESSAGES = 40;

const SYSTEM_PROMPT = [
  '你是终末地地图站（ZMDMAP）的地图助手，帮助玩家查询点位、标记点位、规划采集路线。',
  '',
  '工作方式：',
  '- 涉及“当前 / 附近 / 这张图”时，先调用 get_map_context 拿到当前地图与视图中心。',
  '- 不确定资源的确切分组名时，先 list_point_groups 对齐 groupKey，再 query_points。',
  '- 点位坐标是游戏世界坐标 (x, z)，距离单位与游戏内一致，回答时说“约 N”即可，不要编造单位换算。',
  '- 规划采集路线用 plan_collection_route；只有用户明确要求“保存/画出来”时才传 saveAsRouteName。',
  '- mark_points 会真实修改用户的标记数据，只有用户明确要求标记时才调用，且先说明将标记多少个点。',
  '- 工具返回 truncated=true 说明结果被截断，应当收窄条件重查，不要假装看到了全部。',
  '',
  '回答要求：用用户提问所使用的语言，简洁直接，列点位时带上 id 和名称，不要臆造工具没有返回的点位。',
].join('\n');

let messageSeq = 0;
function nextId(): string {
  messageSeq += 1;
  return `ai_${Date.now().toString(36)}_${messageSeq}`;
}

export interface AiAssistantServiceDeps<T, R> extends AiToolContext<T, R> {
  configService: AiConfigService;
  client: AiClient;
}

/**
 * AI 助手会话。
 *
 * 维护两份消息：`messages` 是面板上给人看的，`history` 是发给供应商的原始
 * 上下文（含 tool_calls / tool 结果）。两者刻意不共用一个结构——展示要折叠
 * 工具细节，而模型必须拿到完整的调用回执才能接着推理。
 */
export class AiAssistantService<T, R> {
  @observable accessor messages: AiDisplayMessage[] = [];
  @observable accessor running: boolean = false;
  /** 最近一次失败的原因，展示在输入框上方 */
  @observable accessor lastError: string | null = null;

  private history: AiChatMessage[] = [];
  private abortController: AbortController | null = null;

  private readonly deps: AiAssistantServiceDeps<T, R>;
  private readonly client: AiClient;
  private readonly toolset: AiToolset<T, R>;

  constructor(deps: AiAssistantServiceDeps<T, R>) {
    this.deps = deps;
    this.client = deps.client;
    this.toolset = new AiToolset({
      adapterRegistry: deps.adapterRegistry,
      mapDataService: deps.mapDataService,
      i18nService: deps.i18nService,
      langHashService: deps.langHashService,
    });
  }

  public get configService(): AiConfigService {
    return this.deps.configService;
  }

  @computed
  public get isEmpty(): boolean {
    return this.messages.length === 0;
  }

  @action
  public clear(): void {
    this.stop();
    this.messages = [];
    this.history = [];
    this.lastError = null;
  }

  public stop(): void {
    this.abortController?.abort();
    this.abortController = null;
    let lastAssistant = this.history.length - 1;
    while (lastAssistant >= 0 && this.history[lastAssistant].role !== 'assistant') lastAssistant--;
    if (lastAssistant >= 0) {
      const answered = new Set(this.history.slice(lastAssistant + 1).map((message) => message.tool_call_id));
      for (const call of this.history[lastAssistant].tool_calls ?? []) {
        if (!answered.has(call.id)) {
          this.history.push({ role: 'tool', tool_call_id: call.id, content: '{"ok":false,"error":"cancelled"}' });
        }
      }
    }
    runInAction(() => {
      this.running = false;
    });
  }

  @action
  private push(message: Omit<AiDisplayMessage, 'id' | 'createdAt'>): AiDisplayMessage {
    const full: AiDisplayMessage = { ...message, id: nextId(), createdAt: Date.now() };
    this.messages = [...this.messages, full];
    // 返回数组里的那个引用，流式写入才能被 mobx 观测到
    return this.messages[this.messages.length - 1];
  }

  /** 发送一条用户消息，并跑完随之而来的工具调用循环。 */
  public async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.running) return;

    const config = this.configService.config;
    if (!this.configService.isConfigured) {
      runInAction(() => {
        this.lastError = this.deps.i18nService.translate('settings:ai.error.not_configured', {
          defaultValue: '请先在设置里配置 AI 供应商与模型',
        });
      });
      return;
    }

    this.push({ role: 'user', content });
    if (this.history.length === 0) {
      this.history.push({ role: 'system', content: SYSTEM_PROMPT });
    }
    this.trimHistory();
    this.history.push({ role: 'user', content });

    const controller = new AbortController();
    this.abortController = controller;
    runInAction(() => {
      this.running = true;
      this.lastError = null;
    });

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const pending = this.push({ role: 'assistant', content: '' });

        const completion = await this.client.chat(config, {
          messages: this.history,
          tools: Object.values(this.toolset.tools).map((tool) => tool.schema),
          signal: controller.signal,
          onDelta: (delta) => {
            if (controller.signal.aborted) return;
            runInAction(() => {
              pending.content += delta;
            });
          },
        });

        if (controller.signal.aborted) return;

        runInAction(() => {
          pending.content = completion.content;
          // 这一轮只有工具调用、没有正文时，占位气泡留着是空的，直接移除
          if (!completion.content && completion.toolCalls.length > 0) {
            this.messages = this.messages.filter((message) => message.id !== pending.id);
          }
        });

        this.history.push({
          role: 'assistant',
          content: completion.content,
          tool_calls: completion.toolCalls,
        });

        if (completion.toolCalls.length === 0) return;

        for (const call of completion.toolCalls) {
          if (controller.signal.aborted) return;
          const result = await this.runTool(call, controller.signal);
          if (controller.signal.aborted) return;
          this.history.push({
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: this.serializeToolResult(result),
          });
        }
      }

      if (controller.signal.aborted) return;

      // 轮数用尽仍在调工具：给用户一个明确的收尾，而不是静默停住
      this.push({
        role: 'assistant',
        content: this.deps.i18nService.translate('settings:ai.error.tool_rounds_exceeded', {
          defaultValue: '工具调用轮数已达上限，请把问题拆得更具体一些。',
        }),
        error: true,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      // 不用 DOMException 判定：RN 等环境不一定有这个全局构造器
      const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
      if (!aborted) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[AiAssistantService] chat failed', error);
        runInAction(() => {
          this.lastError = message;
        });
        this.push({ role: 'assistant', content: message, error: true });
      }
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
        runInAction(() => {
          this.running = false;
        });
      }
    }
  }

  /**
   * 裁掉过长的上下文，只留 system + 最近若干轮。
   *
   * 必须整轮地切：`tool` 消息一旦和它前面那条带 tool_calls 的 assistant 消息
   * 分家，多数供应商会直接 400。所以切点只落在 user 消息上。
   */
  private trimHistory(): void {
    if (this.history.length <= MAX_HISTORY_MESSAGES) return;

    const system = this.history[0];
    let cut = this.history.length - MAX_HISTORY_MESSAGES;
    while (cut < this.history.length && this.history[cut].role !== 'user') {
      cut++;
    }
    // 找不到可用切点（整段都在一轮里）时宁可不裁，留给供应商侧的上下文限制兜底
    if (cut >= this.history.length) return;
    this.history = [system, ...this.history.slice(cut)];
  }

  private async runTool(call: AiToolCall, signal: AbortSignal): Promise<AiToolResult> {
    const tool = this.toolset.tools[call.function.name];
    if (!tool) {
      return { ok: false, data: { error: `unknown tool: ${call.function.name}` } };
    }

    let args: Record<string, unknown> = {};
    if (call.function.arguments.trim()) {
      try {
        const parsed: unknown = JSON.parse(call.function.arguments);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          args = parsed as Record<string, unknown>;
        }
      } catch {
        return { ok: false, data: { error: 'arguments is not valid JSON' } };
      }
    }

    try {
      const result = await tool.execute(args);
      if (signal.aborted) return result;
      this.push({
        role: 'tool',
        content: '',
        toolName: call.function.name,
        toolSummary: result.summary ?? (result.ok ? 'ok' : 'failed'),
        error: !result.ok,
      });
      return result;
    } catch (error) {
      if (signal.aborted) return { ok: false, data: { error: 'cancelled' } };
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[AiAssistantService] tool ${call.function.name} failed`, error);
      this.push({ role: 'tool', content: '', toolName: call.function.name, toolSummary: message, error: true });
      return { ok: false, data: { error: message } };
    }
  }

  private serializeToolResult(result: AiToolResult): string {
    const text = JSON.stringify({
      ok: result.ok,
      ...(typeof result.data === 'object' ? result.data : { data: result.data }),
    });
    if (text.length <= MAX_TOOL_RESULT_CHARS) return text;
    return `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n[结果过长已截断，请收窄查询条件后重试]`;
  }
}
