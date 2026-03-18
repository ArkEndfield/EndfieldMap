import { describe, expect, it, vi } from 'vitest';

import { GuideDataService } from './guide';

describe('GuideDataService', () => {
  it('fetches a guide by id', async () => {
    const apiGet = vi.fn().mockResolvedValue({ id: 3, title: 'Guide' });
    const service = new GuideDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { method: 'GET' } as RequestInit;
    await expect(service.getGuide(3, options)).resolves.toEqual({ id: 3, title: 'Guide' });

    expect(apiGet).toHaveBeenCalledWith('/guides/3', undefined, options);
  });
});
