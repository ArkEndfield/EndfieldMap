import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayerPositionStore } from './player_position_store';

const { fetchPosition } = vi.hoisted(() => ({ fetchPosition: vi.fn() }));
vi.mock('@/services', () => ({ service: { sklandPositionService: { fetchPosition } } }));
vi.mock('@endfieldmap/tools', () => ({ logger: { debug: vi.fn() } }));

const position = (x: number) => ({ online: true, mapId: 'map01', x, y: 0, z: 0 });

function setup() {
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.useFakeTimers();
  return new PlayerPositionStore();
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchPosition.mockReset();
});

describe('PlayerPositionStore pending requests', () => {
  it('cannot restore a marker after polling stops', async () => {
    const store = setup();
    let resolve!: (value: ReturnType<typeof position>) => void;
    fetchPosition.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const pending = store.refresh();
    store.stop();
    resolve(position(1));
    expect(await pending).toBe(false);
    expect(store.position).toBeNull();
  });

  it('starts a fresh role request and ignores the previous role response', async () => {
    const store = setup();
    let resolveOld!: (value: ReturnType<typeof position>) => void;
    fetchPosition
      .mockReturnValueOnce(
        new Promise((done) => {
          resolveOld = done;
        })
      )
      .mockResolvedValueOnce(position(2));
    store.start('old-role');
    store.start('new-role');
    await Promise.resolve();
    expect(fetchPosition).toHaveBeenCalledWith('new-role');
    expect(store.position?.x).toBe(2);
    resolveOld(position(1));
    await Promise.resolve();
    expect(store.position?.x).toBe(2);
    store.stop();
  });
});
