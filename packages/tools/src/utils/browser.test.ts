import { afterEach, describe, expect, it, vi } from 'vitest';

import { disablePageZoom } from './browser';

describe('disablePageZoom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registers the expected document listeners', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal(
      'document',
      {
        addEventListener,
        removeEventListener,
      } as unknown as Document
    );

    disablePageZoom();

    expect(addEventListener).toHaveBeenCalledTimes(5);
    expect(addEventListener.mock.calls.map((call) => call[0])).toEqual([
      'keydown',
      'wheel',
      'gesturestart',
      'gesturechange',
      'touchmove',
    ]);
  });

  it('prevents keyboard zoom shortcuts', () => {
    const addEventListener = vi.fn();

    vi.stubGlobal(
      'document',
      {
        addEventListener,
        removeEventListener: vi.fn(),
      } as unknown as Document
    );

    disablePageZoom();

    const keydownHandler = addEventListener.mock.calls[0]?.[1] as (event: KeyboardEvent) => void;
    const preventDefault = vi.fn();

    keydownHandler({
      ctrlKey: true,
      metaKey: false,
      key: '+',
      keyCode: 187,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('prevents ctrl wheel and multi-touch zoom gestures', () => {
    const addEventListener = vi.fn();

    vi.stubGlobal(
      'document',
      {
        addEventListener,
        removeEventListener: vi.fn(),
      } as unknown as Document
    );

    disablePageZoom();

    const wheelHandler = addEventListener.mock.calls[1]?.[1] as (event: WheelEvent) => void;
    const touchMoveHandler = addEventListener.mock.calls[4]?.[1] as (event: TouchEvent) => void;

    const wheelPreventDefault = vi.fn();
    wheelHandler({
      ctrlKey: true,
      metaKey: false,
      preventDefault: wheelPreventDefault,
    } as unknown as WheelEvent);

    const touchPreventDefault = vi.fn();
    touchMoveHandler({
      touches: [{}, {}],
      preventDefault: touchPreventDefault,
    } as unknown as TouchEvent);

    expect(wheelPreventDefault).toHaveBeenCalledTimes(1);
    expect(touchPreventDefault).toHaveBeenCalledTimes(1);
  });
});
