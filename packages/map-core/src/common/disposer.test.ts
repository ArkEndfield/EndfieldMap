import { describe, expect, it, vi } from 'vitest';

import { BaseDisposer, Disposer } from './disposer';

class TestDisposer extends BaseDisposer {}

describe('Disposer', () => {
  it('runs and clears registered disposers', () => {
    const disposer = new TestDisposer();
    const first = vi.fn();
    const second = vi.fn();

    disposer.addDisposer(first);
    disposer.addDisposer(second);
    disposer.dispose();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(disposer.disposers).toEqual([]);
  });

  it('works with the concrete Disposer class as well', () => {
    const disposer = new Disposer();
    const fn = vi.fn();

    disposer.addDisposer(fn);
    disposer.dispose();
    disposer.dispose();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
