import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounce, isPromise, throttle } from './optimization';

describe('optimization utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('detects native and promise-like promises', () => {
    expect(isPromise(Promise.resolve(1))).toBe(true);
    expect(isPromise({ then() {}, catch() {} })).toBe(true);
    expect(isPromise({ then() {} })).toBe(false);
    expect(isPromise(123)).toBe(false);
    expect(isPromise(null)).toBe(false);
  });

  it('debounces repeated calls and only executes the latest one', async () => {
    const fn = vi.fn(async (value: number) => value * 2);
    const debounced = debounce(fn, 50);

    expect(debounced(1)).toBeUndefined();
    expect(debounced(2)).toBeUndefined();

    await vi.advanceTimersByTimeAsync(49);
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('supports immediate debounce mode and cancel', async () => {
    const fn = vi.fn(async (value: number) => value + 1);
    const debounced = debounce(fn, 100, true);

    const first = debounced(4);
    expect(fn).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toBe(5);

    debounced(5);
    debounced.cancel();
    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throttles calls and replays the trailing invocation', async () => {
    const fn = vi.fn((value: number) => value * 10);
    const throttled = throttle(fn, 100, { trailing: true });

    expect(throttled(1)).toBe(10);
    expect(throttled(2)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('can disable leading calls and only execute on the trailing edge', async () => {
    const fn = vi.fn((value: number) => value);
    const throttled = throttle(fn, 80, { leading: false, trailing: true });

    expect(throttled(7)).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(80);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(7);
  });
});
