import { JSONLoader } from '@endfieldmap/tools/utils/json_loader';
import { describe, expect, it, vi } from 'vitest';

import { LangHashService } from './lang_hash';

describe('LangHashService', () => {
  it('loads language hash data from the asset url and returns it', async () => {
    const jsonLoader = new JSONLoader();
    const loadJSON = vi.spyOn(jsonLoader, 'loadJSON').mockResolvedValue({ hello: 'abc123' });
    const service = new LangHashService({
      jsonLoader,
      assetService: {
        url: {
          langHash: 'https://assets.example.com/lang',
        },
      } as never,
    });

    await expect(service.init()).resolves.toEqual({ hello: 'abc123' });
    expect(loadJSON).toHaveBeenCalledWith('https://assets.example.com/lang/lang_hash.json');
  });

  it('returns null for empty keys or missing hashes', async () => {
    const jsonLoader = new JSONLoader();
    vi.spyOn(jsonLoader, 'loadJSON').mockResolvedValue({ hello: 'abc123' });
    const service = new LangHashService({
      jsonLoader,
      assetService: {
        url: {
          langHash: 'https://assets.example.com/lang',
        },
      } as never,
    });

    expect(service.getHash(undefined)).toBeNull();
    expect(service.getHash('hello')).toBeNull();

    await service.init();

    expect(service.getHash('hello')).toBe('abc123');
    expect(service.getHash('missing')).toBeNull();
  });
});
