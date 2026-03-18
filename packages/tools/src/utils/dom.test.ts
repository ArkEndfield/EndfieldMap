import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domEventListener } from './dom';

describe('domEventListener', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers and unregisters a plain function listener', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const target = { addEventListener, removeEventListener } as unknown as EventTarget;
    const listener = vi.fn();

    const dispose = domEventListener(target, 'click', listener);

    expect(addEventListener).toHaveBeenCalledWith('click', listener, undefined);

    dispose();

    expect(removeEventListener).toHaveBeenCalledWith('click', listener, undefined);
  });

  it('wraps function listeners with debounce when requested', async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const target = { addEventListener, removeEventListener } as unknown as EventTarget;
    const listener = vi.fn();

    domEventListener(target, 'scroll', listener, { debounce: 50 });

    const wrapped = addEventListener.mock.calls[0]?.[1] as (event: Event) => void;
    wrapped(new Event('scroll'));
    wrapped(new Event('scroll'));

    expect(listener).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('wraps object listeners with throttle when requested', async () => {
    const addEventListener = vi.fn();
    const target = { addEventListener, removeEventListener: vi.fn() } as unknown as EventTarget;
    const listener = {
      handleEvent: vi.fn(),
    };

    domEventListener(target, 'mousemove', listener, { throttle: 100 });

    const wrappedListener = addEventListener.mock.calls[0]?.[1] as { handleEvent: (event: Event) => void };
    wrappedListener.handleEvent(new Event('mousemove'));
    wrappedListener.handleEvent(new Event('mousemove'));

    expect(listener.handleEvent).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);

    expect(listener.handleEvent).toHaveBeenCalledTimes(1);
  });
});
