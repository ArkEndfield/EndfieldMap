import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, ServerService } from './server';

vi.mock('@endfieldmap/tools', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function createServer() {
  const server = new ServerService({
    backendHost: 'https://api.example',
    i18nService: { currentLocale: 'zh-CN', translate: (key: string) => key } as unknown as I18nService,
  });
  server.setToken('old-token');
  const logout = vi.fn();
  server.setUnauthorizedHandler(logout);
  return { server, logout };
}

const denied = () => Response.json({ error: { code: 'UNAUTHORIZED', message: 'expired' } }, { status: 401 });

afterEach(() => vi.unstubAllGlobals());

describe('ServerService session handling', () => {
  it('uses the backend authorize endpoint for every supported provider', () => {
    const { server } = createServer();
    for (const provider of ['github', 'discord', 'qq', 'bilibili']) {
      expect(server.getOAuthAuthorizeUrl(provider)).toBe(`https://api.example/api/v1/auth/oauth/${provider}/authorize`);
    }
    expect(() => server.getOAuthAuthorizeUrl('../callback')).toThrow();
  });

  it('keeps the session when refresh returns 503', async () => {
    const { server, logout } = createServer();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(denied())
        .mockResolvedValueOnce(Response.json({ error: { code: 'INTERNAL', message: 'unavailable' } }, { status: 503 }))
    );
    await expect(server.apiGet('/user/me')).rejects.toBeInstanceOf(ApiError);
    expect(logout).not.toHaveBeenCalled();
    expect(server.getToken()).toBe('old-token');
  });

  it('does not refresh an existing session for an incorrect login password', async () => {
    const { server, logout } = createServer();
    const fetch = vi.fn().mockResolvedValue(denied());
    vi.stubGlobal('fetch', fetch);
    await expect(server.apiPost('/auth/login', { username: 'other', password: 'wrong' })).rejects.toBeInstanceOf(
      ApiError
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps JSON headers on POST requests queued behind refresh', async () => {
    const { server } = createServer();
    let resolveRefresh!: (response: Response) => void;
    const refreshing = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(denied())
      .mockReturnValueOnce(refreshing)
      .mockImplementation(async () => Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetch);
    const first = server.apiGet('/user/me');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const queued = server.apiPost('/user/change-nickname', { nickname: 'alice' });
    resolveRefresh(Response.json({ access_token: 'new-token' }));
    await Promise.all([first, queued]);
    const post = fetch.mock.calls.find(([url]) => String(url).endsWith('/user/change-nickname'));
    expect(new Headers(post?.[1].headers).get('Content-Type')).toBe('application/json');
    expect(new Headers(post?.[1].headers).get('Authorization')).toBe('Bearer new-token');
  });
});
