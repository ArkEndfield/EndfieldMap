import { describe, expect, it, vi } from 'vitest';

import { EndfieldMapEmitter } from './emitter';

interface TestEvents {
  [key: string]: unknown;
  ping: { value: number };
  pong: { message: string };
}

describe('EndfieldMapEmitter', () => {
  it('registers listeners, fires events, and reports listener counts', () => {
    const emitter = new EndfieldMapEmitter<TestEvents>();
    const listener = vi.fn();

    const dispose = emitter.on('ping', listener);

    expect(emitter.listenerCount('ping')).toBe(1);
    expect(emitter.hasListeners('ping')).toBe(true);

    emitter.fire('ping', { value: 3 });

    expect(listener).toHaveBeenCalledWith({ value: 3 });

    dispose();

    expect(emitter.listenerCount('ping')).toBe(0);
    expect(emitter.hasListeners('ping')).toBe(false);
  });

  it('supports once listeners and removes them after the first event', () => {
    const emitter = new EndfieldMapEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.once('pong', listener);
    emitter.fire('pong', { message: 'a' });
    emitter.fire('pong', { message: 'b' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ message: 'a' });
    expect(emitter.listenerCount('pong')).toBe(0);
  });

  it('can remove all listeners for one event or all events', () => {
    const emitter = new EndfieldMapEmitter<TestEvents>();
    const pingListener = vi.fn();
    const pongListener = vi.fn();

    emitter.on('ping', pingListener);
    emitter.on('pong', pongListener);
    emitter.removeAllListeners('ping');

    emitter.fire('ping', { value: 1 });
    emitter.fire('pong', { message: 'ok' });

    expect(pingListener).not.toHaveBeenCalled();
    expect(pongListener).toHaveBeenCalledTimes(1);

    emitter.removeAllListeners();

    expect(emitter.listenerCount('ping')).toBe(0);
    expect(emitter.listenerCount('pong')).toBe(0);
    expect(Array.from(emitter.getAllListenerCounts().entries())).toEqual([]);
  });

  it('isolates listener failures so other listeners still run', () => {
    const emitter = new EndfieldMapEmitter<TestEvents>();
    const badListener = vi.fn(() => {
      throw new Error('boom');
    });
    const goodListener = vi.fn();

    emitter.on('ping', badListener);
    emitter.on('ping', goodListener);

    expect(() => emitter.fire('ping', { value: 9 })).not.toThrow();
    expect(badListener).toHaveBeenCalledTimes(1);
    expect(goodListener).toHaveBeenCalledWith({ value: 9 });
  });
});
