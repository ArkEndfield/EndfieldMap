import { describe, expect, it } from 'vitest';

import { buildMapsByKey, resolveSelectPlacement } from './share_link_resolve';

// map01: kHome | map02: kA, kB | map05: kC
const mapData = new Map<string, Map<string, unknown>>([
  ['map01', new Map([['kHome', {}]])],
  [
    'map02',
    new Map([
      ['kA', {}],
      ['kB', {}],
    ]),
  ],
  ['map05', new Map([['kC', {}]])],
]);

describe('buildMapsByKey', () => {
  it('inverts mapData into key -> mapIds', () => {
    const idx = buildMapsByKey(mapData);
    expect(idx.get('kHome')).toEqual(['map01']);
    expect(idx.get('kA')).toEqual(['map02']);
    expect(idx.get('kB')).toEqual(['map02']);
    expect(idx.get('kC')).toEqual(['map05']);
    expect(idx.get('nope')).toBeUndefined();
  });

  it('lists every map containing a shared key', () => {
    const shared = new Map<string, Map<string, unknown>>([
      ['map02', new Map([['kB', {}]])],
      ['map05', new Map([['kB', {}]])],
    ]);
    expect(buildMapsByKey(shared).get('kB')).toEqual(['map02', 'map05']);
  });
});

describe('resolveSelectPlacement', () => {
  const idx = buildMapsByKey(mapData);

  it('all keys on target -> none', () => {
    const r = resolveSelectPlacement(idx, ['kHome'], 'map01', false);
    expect(r.onMap).toEqual(['kHome']);
    expect(r.offMap).toEqual([]);
    expect(r.unknown).toEqual([]);
    expect(r.switchMode).toBe('none');
    expect(r.switchTarget).toBeNull();
  });

  it('single off-map key (no id) -> auto switch to its map', () => {
    const r = resolveSelectPlacement(idx, ['kC'], 'map01', false);
    expect(r.offMap).toEqual([{ key: 'kC', homeMaps: ['map05'] }]);
    expect(r.switchMode).toBe('auto');
    expect(r.switchTarget).toBe('map05');
  });

  it('off-map keys but anchor id present -> none (info only)', () => {
    const r = resolveSelectPlacement(idx, ['kC'], 'map01', true);
    expect(r.offMap.map((o) => o.key)).toEqual(['kC']);
    expect(r.switchMode).toBe('none');
    expect(r.switchTarget).toBeNull();
  });

  it('multiple off-map keys -> ask, target = map with most coverage', () => {
    const r = resolveSelectPlacement(idx, ['kA', 'kB', 'kC'], 'map01', false);
    expect(r.switchMode).toBe('ask');
    expect(r.switchTarget).toBe('map02'); // map02 covers kA+kB (2) > map05 covers kC (1)
  });

  it('coverage tie -> earliest map in scan order wins', () => {
    // kB on map02+map05, kC on map05 -> map05 covers kB+kC (2), map02 covers kB (1)
    const tie = buildMapsByKey(
      new Map<string, Map<string, unknown>>([
        ['map02', new Map([['kB', {}]])],
        [
          'map05',
          new Map([
            ['kB', {}],
            ['kC', {}],
          ]),
        ],
      ])
    );
    const r = resolveSelectPlacement(tie, ['kB', 'kC'], 'map01', false);
    expect(r.switchMode).toBe('ask');
    expect(r.switchTarget).toBe('map05');
  });

  it('unknown keys are classified separately and excluded from switching', () => {
    const r = resolveSelectPlacement(idx, ['kA', 'ghost'], 'map01', false);
    expect(r.offMap.map((o) => o.key)).toEqual(['kA']);
    expect(r.unknown).toEqual(['ghost']);
    expect(r.switchMode).toBe('ask'); // selectKeys.length === 2
    expect(r.switchTarget).toBe('map02');
  });

  it('single unknown key -> none (nowhere to switch)', () => {
    const r = resolveSelectPlacement(idx, ['ghost'], 'map01', false);
    expect(r.offMap).toEqual([]);
    expect(r.unknown).toEqual(['ghost']);
    expect(r.switchMode).toBe('none');
  });
});
