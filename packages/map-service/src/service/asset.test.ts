import { describe, expect, it } from 'vitest';

import { AssetService } from './asset';

describe('AssetService', () => {
  it('returns relative asset paths when the host is empty or not absolute', () => {
    const service = new AssetService('');

    expect(service.url.mapImage).toBe('/images/map');
    expect(service.url.audio).toBe('/audio');
  });

  it('prefixes asset paths with the configured host', () => {
    const service = new AssetService('https://assets.example.com/base/');

    expect(service.url.mapImage).toBe('https://assets.example.com/images/map');
    expect(service.url.langHash).toBe('https://assets.example.com/data/entity/1.1.9');
    expect(service.url.audio).toBe('https://assets.example.com/audio');
  });
});
