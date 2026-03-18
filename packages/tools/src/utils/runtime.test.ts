import { afterEach, describe, expect, it, vi } from 'vitest';

import { getVersionInfo } from './runtime';

describe('getVersionInfo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns injected build globals when they are available', () => {
    vi.stubGlobal('__COMMIT_HASH__', 'abc123');
    vi.stubGlobal('__BUILD_TIME__', '2026-03-18T00:00:00.000Z');

    expect(getVersionInfo()).toEqual({
      commitHash: 'abc123',
      buildTime: '2026-03-18T00:00:00.000Z',
    });
  });

  it('falls back to generated timestamp strings when globals are missing', () => {
    const info = getVersionInfo();

    expect(typeof info.commitHash).toBe('string');
    expect(typeof info.buildTime).toBe('string');
    expect(info.commitHash.length).toBeGreaterThan(0);
    expect(info.buildTime.length).toBeGreaterThan(0);
  });
});
