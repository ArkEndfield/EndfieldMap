import { describe, expect, it, vi } from 'vitest';

import { AnnouncementDataService } from './announcement';

describe('AnnouncementDataService', () => {
  it('loads announcement list via apiGet and maps the V2 wire shape', async () => {
    const apiGet = vi.fn().mockResolvedValue({
      announcements: [
        {
          id: 1,
          lang: 'zh-CN',
          category: 'notice',
          title: 'T',
          version: 'v1',
          published_at: '2026-01-02T00:00:00Z',
        },
      ],
    });
    const service = new AnnouncementDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { cache: 'no-store' } as RequestInit;
    await expect(service.loadAnnouncementList(options)).resolves.toEqual([
      {
        id: 1,
        lang: 'zh-CN',
        category: 'notice',
        title: 'T',
        version: 'v1',
        published_at: Math.floor(Date.parse('2026-01-02T00:00:00Z') / 1000),
      },
    ]);

    expect(apiGet).toHaveBeenCalledWith('/announcements', undefined, options);
  });

  it('loads announcement detail by id', async () => {
    const apiGet = vi.fn().mockResolvedValue({
      id: 7,
      lang: 'zh-CN',
      category: 'notice',
      title: 'Announcement',
      version: 'v1',
      content: 'hello',
      link: 'https://example.com',
      published_at: '2026-01-02T00:00:00Z',
    });
    const service = new AnnouncementDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { headers: { Accept: 'application/json' } } as RequestInit;
    await expect(service.loadAnnouncementDetail(7, options)).resolves.toEqual({
      id: 7,
      lang: 'zh-CN',
      category: 'notice',
      title: 'Announcement',
      version: 'v1',
      published_at: Math.floor(Date.parse('2026-01-02T00:00:00Z') / 1000),
      content: 'hello',
      link: 'https://example.com',
    });

    expect(apiGet).toHaveBeenCalledWith('/announcements/7', undefined, options);
  });
});
