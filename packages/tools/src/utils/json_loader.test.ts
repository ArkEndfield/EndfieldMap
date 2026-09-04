import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JSONLoader } from './json_loader';

describe('JSONLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('appends a version query param and resolves successful JSON', async () => {
    vi.stubGlobal('__COMMIT_HASH__', 'commit-1');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const loader = new JSONLoader();

    await expect(loader.loadJSON('https://example.com/data.json')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/data.json?v=commit-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('uses a timestamp instead of the commit hash in dev mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('__COMMIT_HASH__', 'commit-dev');
    vi.setSystemTime(1721000000000);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.resetModules();
    const { JSONLoader: DevJSONLoader } = await import('./json_loader');
    const loader = new DevJSONLoader();

    await expect(loader.loadJSON('https://example.com/data.json')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/data.json?v=1721000000000',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('retries failed requests until one succeeds', async () => {
    vi.stubGlobal('__COMMIT_HASH__', 'commit-2');
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recovered: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const loader = new JSONLoader();
    const promise = loader.loadJSON('https://example.com/retry.json', 2, 50);

    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ recovered: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    vi.stubGlobal('__COMMIT_HASH__', 'commit-3');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', fetchMock);

    const loader = new JSONLoader();
    const assertion = expect(loader.loadJSON('https://example.com/fail.json', 2, 10)).rejects.toThrow(
      'Failed to load JSON after 2 retries'
    );

    await vi.runAllTimersAsync();

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
