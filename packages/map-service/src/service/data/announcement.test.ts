import { describe, expect, it, vi } from 'vitest';

import { AnnouncementDataService } from './announcement';

describe('AnnouncementDataService', () => {
  it('loads announcement list via apiGet', async () => {
    const apiGet = vi.fn().mockResolvedValue([{ id: 1 }]);
    const service = new AnnouncementDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { cache: 'no-store' } as RequestInit;
    await expect(service.loadAnnouncementList(options)).resolves.toEqual([{ id: 1 }]);

    expect(apiGet).toHaveBeenCalledWith('/announcements', undefined, options);
  });

  it('loads announcement detail by id', async () => {
    const apiGet = vi.fn().mockResolvedValue({ id: 7, title: 'Announcement' });
    const service = new AnnouncementDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { headers: { Accept: 'application/json' } } as RequestInit;
    await expect(service.loadAnnouncementDetail(7, options)).resolves.toEqual({ id: 7, title: 'Announcement' });

    expect(apiGet).toHaveBeenCalledWith('/announcements/7', undefined, options);
  });
});
