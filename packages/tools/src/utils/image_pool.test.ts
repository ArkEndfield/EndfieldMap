import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImagePool } from './image_pool';

describe('ImagePool', () => {
  afterEach(() => {
    ImagePool.imagePool.clear();
    ImagePool.currentPoolSize = 0;
    ImagePool.maxPoolSize = 500;
    vi.unstubAllGlobals();
  });

  it('creates and caches images by src', () => {
    class FakeImage {
      public src = '';
    }

    vi.stubGlobal('Image', FakeImage);

    const first = ImagePool.getImage('/a.png');
    const second = ImagePool.getImage('/a.png');

    expect(first.isPool).toBe(false);
    expect(second.isPool).toBe(true);
    expect(second.image).toBe(first.image);
    expect(ImagePool.currentPoolSize).toBe(1);
  });

  it('evicts the oldest pooled image when maxPoolSize is exceeded', () => {
    class FakeImage {
      public src = '';
    }

    vi.stubGlobal('Image', FakeImage);
    ImagePool.maxPoolSize = 1;

    const first = ImagePool.addImage('/a.png');
    const second = ImagePool.addImage('/b.png');

    expect(first.src).toBe('/a.png');
    expect(second.src).toBe('/b.png');
    expect(ImagePool.imagePool.has('/a.png')).toBe(false);
    expect(ImagePool.imagePool.has('/b.png')).toBe(true);
    expect(ImagePool.currentPoolSize).toBe(1);
  });

  it('decrements the pool size only when an image exists', () => {
    class FakeImage {
      public src = '';
    }

    vi.stubGlobal('Image', FakeImage);

    ImagePool.addImage('/a.png');
    ImagePool.removeImage('/a.png');
    ImagePool.removeImage('/missing.png');

    expect(ImagePool.currentPoolSize).toBe(0);
  });
});
