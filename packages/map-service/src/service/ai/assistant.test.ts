import type { AiChatMessage, AiCompletion, AiToolCall, AiToolResult } from '@endfieldmap/map-service/@types/ai';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiAssistantService, type AiAssistantServiceDeps } from './assistant';

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('@endfieldmap/tools', () => ({ logger: { error: vi.fn() } }));
vi.mock('@endfieldmap/map-service/service/ai/tools', () => ({
  AiToolset: class {
    tools = { mark_points: { execute, schema: { type: 'function', function: { name: 'mark_points' } } } };
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function harness() {
  const chat = vi.fn();
  const service = new AiAssistantService({
    client: { chat },
    configService: { isConfigured: true, config: {} },
    i18nService: { translate: (key: string) => key },
  } as unknown as AiAssistantServiceDeps<unknown, unknown>);
  return { service, chat };
}

const call: AiToolCall = { id: 'mark-1', type: 'function', function: { name: 'mark_points', arguments: '{}' } };
afterEach(() => execute.mockReset());

describe('AiAssistantService conversation lifecycle', () => {
  it('does not execute late tool calls after stop', async () => {
    const { service, chat } = harness();
    const completion = deferred<AiCompletion>();
    chat.mockReturnValue(completion.promise);
    const pending = service.send('mark points');
    service.stop();
    completion.resolve({ content: '', toolCalls: [call] });
    await pending;
    expect(execute).not.toHaveBeenCalled();
  });

  it('keeps a new request running when the stopped request finishes', async () => {
    const { service, chat } = harness();
    const old = deferred<AiCompletion>();
    const current = deferred<AiCompletion>();
    chat.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const first = service.send('first');
    service.stop();
    const second = service.send('second');
    old.resolve({ content: 'late', toolCalls: [] });
    await first;
    expect(service.running).toBe(true);
    current.resolve({ content: 'current', toolCalls: [] });
    await second;
    expect(service.running).toBe(false);
  });

  it('preserves final assistant answers in the next request', async () => {
    const { service, chat } = harness();
    chat.mockResolvedValue({ content: 'answer', toolCalls: [] });
    await service.send('first');
    await service.send('second');
    const history = chat.mock.calls[1][1].messages as AiChatMessage[];
    expect(history).toContainEqual({ role: 'assistant', content: 'answer', tool_calls: [] });
  });

  it('completes cancelled tool replies before a new conversation turn', async () => {
    const { service, chat } = harness();
    const tool = deferred<AiToolResult>();
    execute.mockReturnValue(tool.promise);
    chat.mockResolvedValueOnce({ content: '', toolCalls: [call] });
    const first = service.send('mark points');
    await vi.waitFor(() => expect(execute).toHaveBeenCalled());
    service.stop();
    chat.mockResolvedValueOnce({ content: 'next', toolCalls: [] });
    await service.send('next');
    const history = chat.mock.calls[1][1].messages as AiChatMessage[];
    expect(history.filter((message) => message.tool_call_id === call.id)).toHaveLength(1);
    tool.resolve({ ok: true, data: {} });
    await first;
    expect(history.filter((message) => message.tool_call_id === call.id)).toHaveLength(1);
  });
});
