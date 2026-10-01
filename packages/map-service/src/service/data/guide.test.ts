import { describe, expect, it, vi } from 'vitest';

import { GuideDataService } from './guide';

describe('GuideDataService', () => {
  it('fetches a guide by id and maps the V2 wire shape', async () => {
    const apiGet = vi.fn().mockResolvedValue({
      record_id: 'rec3',
      internal_id: 3,
      area: 'a',
      marker_type: 'm',
      description: 'd',
      layer_map: 'l',
      visible: '是',
      refreshable: '否',
      progress: '0',
      images: ['https://example.com/1.png'],
      video: ['att1'],
    });
    const service = new GuideDataService({
      serverService: {
        apiGet,
      } as never,
    });

    const options = { method: 'GET' } as RequestInit;
    await expect(service.getGuide(3, options)).resolves.toEqual({
      record_id: 'rec3',
      internal_id: 3,
      area: 'a',
      marker_type: 'm',
      description: 'd',
      layer_map: 'l',
      visible: '是',
      refreshable: '否',
      progress: '0',
      images: ['https://example.com/1.png'],
      video_links: ['att1'],
    });

    expect(apiGet).toHaveBeenCalledWith('/guides/3', undefined, options);
  });
});
