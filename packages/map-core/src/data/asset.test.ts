import { describe, expect, it } from 'vitest';

import { EndfieldMapAsset } from './asset';

describe('EndfieldMapAsset', () => {
  it('stores the provided map and entity image paths', () => {
    const asset = new EndfieldMapAsset({
      mapImage: '/images/map.png',
      entityImage: '/images/entity.png',
    });

    expect(asset.mapImage).toBe('/images/map.png');
    expect(asset.entityImage).toBe('/images/entity.png');
  });
});
