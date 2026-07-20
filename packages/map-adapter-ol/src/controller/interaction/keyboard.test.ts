import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KeyboardMoveController } from './keyboard';

type Listener = (event: unknown) => void;

function createMapInstance(setCenter: (center: number[]) => void): EndfieldMap {
  const view = {
    getResolution: () => 1,
    getCenter: () => [0, 0],
    setCenter,
  };
  return { map: { getView: () => view } } as unknown as EndfieldMap;
}

describe('KeyboardMoveController', () => {
  let listeners: Record<string, Listener[]>;
  let rafQueue: Map<number, FrameRequestCallback>;
  let rafSeq: number;
  let documentStub: { visibilityState: string; addEventListener: unknown; removeEventListener: unknown };

  const dispatch = (type: string, event: unknown = {}) => {
    (listeners[type] ?? []).forEach((l) => l(event));
  };

  // 推进一帧：执行当前已排队的 rAF 回调（loop 内部会重新排队下一帧）
  const flushFrame = () => {
    const pending = [...rafQueue.values()];
    rafQueue.clear();
    pending.forEach((cb) => cb(0));
  };

  const pressKey = (key: string) => dispatch('keydown', { key, target: null, preventDefault: vi.fn() });

  beforeEach(() => {
    listeners = {};
    rafQueue = new Map();
    rafSeq = 0;

    const addEventListener = vi.fn((type: string, cb: Listener) => {
      (listeners[type] ??= []).push(cb);
    });
    const removeEventListener = vi.fn((type: string, cb: Listener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== cb);
    });

    documentStub = { visibilityState: 'visible', addEventListener, removeEventListener };

    vi.stubGlobal('window', { addEventListener, removeEventListener });
    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++rafSeq;
      rafQueue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('按住 W 时窗口失焦（blur）应立即停止滑动（Alt+Tab 切屏场景）', () => {
    const setCenter = vi.fn();
    const controller = new KeyboardMoveController({ speed: 0.5, mapInstance: createMapInstance(setCenter) });

    pressKey('w');
    flushFrame();
    expect(setCenter).toHaveBeenCalledTimes(1); // 地图开始移动

    // 模拟 Alt+Tab / 切换应用：窗口失焦，松键的 keyup 不会再派发到本 window
    dispatch('blur');

    const callsAtBlur = setCenter.mock.calls.length;
    flushFrame();
    flushFrame();
    // 失焦后循环应已停止，地图不再滑动
    expect(setCenter.mock.calls.length).toBe(callsAtBlur);

    controller.dispose();
  });

  it('按住 W 时页面隐藏（visibilitychange=hidden）应停止滑动', () => {
    const setCenter = vi.fn();
    const controller = new KeyboardMoveController({ speed: 0.5, mapInstance: createMapInstance(setCenter) });

    pressKey('w');
    flushFrame();
    expect(setCenter).toHaveBeenCalledTimes(1);

    documentStub.visibilityState = 'hidden';
    dispatch('visibilitychange');

    const callsAtHidden = setCenter.mock.calls.length;
    flushFrame();
    expect(setCenter.mock.calls.length).toBe(callsAtHidden);

    controller.dispose();
  });

  it('正常松开按键（keyup）仍应停止滑动', () => {
    const setCenter = vi.fn();
    const controller = new KeyboardMoveController({ speed: 0.5, mapInstance: createMapInstance(setCenter) });

    pressKey('w');
    flushFrame();
    expect(setCenter).toHaveBeenCalledTimes(1);

    dispatch('keyup', { key: 'w' });

    const callsAtKeyup = setCenter.mock.calls.length;
    flushFrame();
    expect(setCenter.mock.calls.length).toBe(callsAtKeyup);

    controller.dispose();
  });
});
