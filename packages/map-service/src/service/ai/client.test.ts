import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiClient } from './client';

/** 把字符串切成手动分块的 SSE 流（chunk 边界故意切在 JSON 中间）。 */
function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

function sseResponse(chunks: string[]): Response {
  return new Response(sseStream(chunks), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const config = { baseUrl: 'https://ai.example.com', apiKey: 'k', model: 'm', temperature: 0.1 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AiClient.chat', () => {
  it('rejects empty baseUrl instead of POSTing a relative URL to our own origin', async () => {
    const client = new AiClient();
    await expect(client.chat({ ...config, baseUrl: '' }, { messages: [] })).rejects.toThrow('baseUrl is empty');
  });

  it('parses a streamed reply split across chunk boundaries', async () => {
    // 第一个 data 行的 JSON 在 chunk 边界被拦腰切断
    const response = sseResponse([
      'data: {"choices":[{"delta":{"conte',
      'nt":"你好"}}]}\n\ndata: {"choices":[{"delta":{"content":"地图"}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    ]);
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    const deltas: string[] = [];
    const result = await new AiClient().chat(config, { messages: [], onDelta: (t) => deltas.push(t) });

    expect(deltas).toEqual(['你好', '地图']);
    expect(result.content).toBe('你好地图');
    expect(result.finishReason).toBe('stop');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai.example.com/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('merges tool_call deltas that arrive name/arguments-first and out of order', async () => {
    const response = sseResponse([
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_a","function":{"name":"que"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"call_b","function":{"name":"focus_point"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"id\\":1"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"}"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n\n',
    ]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const result = await new AiClient().chat(config, { messages: [], onDelta: () => {} });

    expect(result.toolCalls).toHaveLength(2);
    // 按 index 排序：0 在前，1 在后，参数分片完整拼接
    expect(result.toolCalls[0]).toEqual({
      id: 'call_a',
      type: 'function',
      function: { name: 'que', arguments: '{"id":1}' },
    });
    expect(result.toolCalls[1]?.id).toBe('call_b');
    expect(result.finishReason).toBe('tool_calls');
  });

  it('handles CRLF-style SSE separators without losing events', async () => {
    const response = sseResponse([
      'data: {"choices":[{"delta":{"content":"a"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"b"}}]}\r\n\r\n',
      'data: [DONE]\r\n\r\n',
    ]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const result = await new AiClient().chat(config, { messages: [], onDelta: () => {} });
    expect(result.content).toBe('ab');
  });

  it('throws the provider error message carried inside the stream', async () => {
    const response = sseResponse(['data: {"error":{"message":"invalid api key"}}\n\n']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(new AiClient().chat(config, { messages: [], onDelta: () => {} })).rejects.toThrow('invalid api key');
  });

  it('falls back to whole-body parsing without onDelta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [{ message: { content: 'hi', tool_calls: [{ id: 'c', type: 'function', function: { name: 'x', arguments: '{}' } }] }, finish_reason: 'tool_calls' }],
        })
      )
    );

    const result = await new AiClient().chat(config, { messages: [] });
    expect(result.content).toBe('hi');
    expect(result.toolCalls[0]?.function.name).toBe('x');
  });
});

describe('AiClient error surfaces', () => {
  it('prefixes HTTP status and extracts {error:{message}} from non-2xx JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'quota exceeded' } }, 429)));

    await expect(new AiClient().chat(config, { messages: [] })).rejects.toThrow('HTTP 429: quota exceeded');
  });

  it('falls back to the raw body when the error is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('gateway timeout', { status: 504 })));

    await expect(new AiClient().chat(config, { messages: [] })).rejects.toThrow('HTTP 504: gateway timeout');
  });

  it('extracts a model list from either data[] or models[] and drops empty ids', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ data: [{ id: 'gpt-x' }, { name: 'ollama-y' }, { owned_by: 'z' }] }))
    );

    const models = await new AiClient().listModels(config);
    expect(models.map((m) => m.id)).toEqual(['gpt-x', 'ollama-y']);
  });

  it('rejects listModels with an empty baseUrl', async () => {
    await expect(new AiClient().listModels({ ...config, baseUrl: '' })).rejects.toThrow('baseUrl is empty');
  });
});
