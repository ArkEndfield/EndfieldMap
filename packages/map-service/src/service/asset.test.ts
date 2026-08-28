import { describe, expect, it } from 'vitest';

import { AssetService } from './asset';

describe('AssetService', () => {
  it('returns relative asset paths when the host is empty or not absolute', () => {
    const service = new AssetService('');

    expect(service.url.mapData).toBe('/output_beyondmap');
    expect(service.url.langI18n).toBe('/output_beyondmap/i18n');
  });

  it('prefixes asset paths with the configured host', () => {
    const service = new AssetService('https://assets.example.com/base/');

    expect(service.url.mapData).toBe('https://assets.example.com/output_beyondmap');
    expect(service.url.miniGameData).toBe('https://assets.example.com/output_beyondmap/minigame');
    expect(service.url.entityImage).toBe('https://assets.example.com/output_image/itemiconbig');
  });

  it('keeps CDN-backed absolute URLs independent of the configured host', () => {
    const service = new AssetService('');

    expect(service.url.mapImage).toBe('https://assets.zmdmap.com/images/map');
    expect(service.url.avatar).toBe('https://assets.zmdmap.com/images/avatar');
    expect(service.url.misc).toBe('https://assets.zmdmap.com/images/misc');
    expect(service.url.audio).toBe('https://assets.zmdmap.com/audio');
  });
});
