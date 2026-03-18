import { afterEach, describe, expect, it, vi } from 'vitest';

import { IdGenerator } from './id_generator';

describe('IdGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates an id within the provided range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    const id = IdGenerator.generate(new Set<number>(), 10, 20);

    expect(id).toBe(12);
  });

  it('retries until it finds an unused id', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.8);

    const id = IdGenerator.generate(new Set<number>([10]), 10, 15);

    expect(id).toBe(14);
  });

  it('throws when the range is invalid', () => {
    expect(() => IdGenerator.generate(new Set<number>(), 5, 5)).toThrow('Invalid ID range');
    expect(() => IdGenerator.generate(new Set<number>(), 8, 3)).toThrow('Invalid ID range');
  });

  it('throws when the range is exhausted', () => {
    expect(() => IdGenerator.generate(new Set<number>([1, 2, 3]), 1, 4)).toThrow('ID range exhausted');
  });
});
