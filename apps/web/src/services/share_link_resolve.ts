export interface SelectHomeInfo {
  key: string;
  /** maps that contain this key (excludes the target map) */
  homeMaps: string[];
}

export interface SelectResolution {
  /** select keys present on the target map (in select order) */
  onMap: string[];
  /** select keys not on the target map but present on at least one other map */
  offMap: SelectHomeInfo[];
  /** select keys present on no map at all (stale / invalid) */
  unknown: string[];
  switchMode: 'auto' | 'ask' | 'none';
  /** map to switch to for auto/ask, else null */
  switchTarget: string | null;
}

/** Invert mapData (mapId -> key -> group) into key -> mapIds[]. */
export function buildMapsByKey(
  mapData: ReadonlyMap<string, ReadonlyMap<string, unknown>>
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const [mapId, groups] of mapData) {
    for (const key of groups.keys()) {
      const arr = result.get(key);
      if (arr) {
        arr.push(mapId);
      } else {
        result.set(key, [mapId]);
      }
    }
  }
  return result;
}

/** Map covering the most off-map keys; ties resolved by earliest appearance. */
function pickBestMap(offMap: SelectHomeInfo[]): string {
  const score = new Map<string, number>();
  const order: string[] = [];
  for (const { homeMaps } of offMap) {
    for (const mapId of homeMaps) {
      if (!score.has(mapId)) {
        score.set(mapId, 0);
        order.push(mapId);
      }
      score.set(mapId, (score.get(mapId) ?? 0) + 1);
    }
  }
  let best = order[0];
  for (const mapId of order) {
    if ((score.get(mapId) ?? 0) > (score.get(best) ?? 0)) {
      best = mapId;
    }
  }
  return best;
}

export function resolveSelectPlacement(
  mapsByKey: ReadonlyMap<string, string[]>,
  selectKeys: string[],
  targetMapId: string,
  hasAnchorId: boolean
): SelectResolution {
  const onMap: string[] = [];
  const offMap: SelectHomeInfo[] = [];
  const unknown: string[] = [];

  for (const key of selectKeys) {
    const maps = mapsByKey.get(key);
    if (!maps || maps.length === 0) {
      unknown.push(key);
    } else if (maps.includes(targetMapId)) {
      onMap.push(key);
    } else {
      offMap.push({ key, homeMaps: maps });
    }
  }

  let switchMode: SelectResolution['switchMode'] = 'none';
  let switchTarget: string | null = null;

  if (offMap.length > 0 && !hasAnchorId) {
    if (selectKeys.length === 1) {
      switchMode = 'auto';
      switchTarget = offMap[0].homeMaps[0];
    } else {
      switchMode = 'ask';
      switchTarget = pickBestMap(offMap);
    }
  }

  return { onMap, offMap, unknown, switchMode, switchTarget };
}
