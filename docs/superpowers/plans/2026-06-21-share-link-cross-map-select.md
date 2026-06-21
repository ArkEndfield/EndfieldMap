# Share Link — Cross-Map `select` Recognition & Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a share link's `select` categories aren't on the target map, inform the user via alert (auto-switch for a single category, ask for multiple), and render the selected categories as a dismissible bottom strip with badges on the off-map ones.

**Architecture:** A pure resolver (`share_link_resolve.ts`) decides on-map / off-map / switch policy; `applyShareLinkParams` orchestrates map/id/select + alerts and writes the selected keys to a MobX store (`shareSelectStore`); a themed bottom strip (`ShareSelectBar`, reusing `OperationList` with a new `position` prop) renders chips with badges and click behavior.

**Tech Stack:** React 19, MobX (`@observable accessor`, 2023-11 decorators), motion, Tailwind, vitest (node env), i18next (14 locales).

**Reference spec:** `docs/superpowers/specs/2026-06-21-share-link-cross-map-select-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/web/package.json` | add `test` / `test:run` scripts (enable vitest for the app) |
| `apps/web/src/services/share_link_resolve.ts` | **pure** index-build + on/off-map partition + switch decision |
| `apps/web/src/services/share_link_resolve.test.ts` | unit tests for the resolver |
| `apps/web/src/services/share_select_store.ts` | MobX store: `selectKeys` / `visible` / `setSelect` / `close` |
| `apps/web/src/services/share_select_store.test.ts` | unit test for the store |
| `apps/web/src/components/themes/endfield/components/topbar/operation_list.tsx` | add `position?: 'top' \| 'bottom'` |
| `apps/web/src/components/themes/endfield/ui/share_select/chip.tsx` | one chip: icon + name + off-map badge + click |
| `apps/web/src/components/themes/endfield/ui/share_select/alert_content.tsx` | rich alert body listing off-map categories + their maps |
| `apps/web/src/components/themes/endfield/ui/share_select/index.tsx` | `ShareSelectBar` (observer) wiring store + map data + clicks |
| `apps/web/src/Map.tsx` | mount `<ShareSelectBar />` |
| `apps/web/src/services/share_link.ts` → `share_link.tsx` | rewrite `applyShareLinkParams` (resolver + alerts + store); file renamed for JSX |
| `packages/map-service/src/locales/*/common.json` ×14 | add `share_link.*` keys |
| `packages/map-service/src/@types/resources.d.ts` | regenerate via `pnpm lng:type` |

---

## Task 1: Enable vitest for `apps/web`

**Files:**
- Modify: `apps/web/package.json:6-13` (scripts block)

- [ ] **Step 1: Add test scripts**

In `apps/web/package.json`, add two scripts to the `"scripts"` object (after `"preview"`):

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.app.json --noEmit && vite build",
    "typecheck": "tsc -p tsconfig.app.json --noEmit",
    "lint": "eslint .",
    "lint:fix": "prettier --write . && eslint . --fix",
    "preview": "vite preview",
    "test": "vitest run",
    "test:run": "vitest run"
  },
```

(Root already provides `vitest` (`catalog:`); other packages run the same way with no local config. Node env + `**/*.test.ts` are vitest defaults, which is all the pure tests below need.)

- [ ] **Step 2: Verify the runner resolves**

Run: `pnpm --filter ./apps/web exec vitest run`
Expected: exits 0 with "No test files found" (no tests yet) — confirms vitest is wired.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json
git commit -m "test(web): enable vitest runner for apps/web"
```

---

## Task 2: Pure resolver — `share_link_resolve.ts`

**Files:**
- Create: `apps/web/src/services/share_link_resolve.ts`
- Test: `apps/web/src/services/share_link_resolve.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/services/share_link_resolve.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildMapsByKey, resolveSelectPlacement } from './share_link_resolve';

// map01: kHome | map02: kA, kB | map05: kC
const mapData = new Map<string, Map<string, unknown>>([
  ['map01', new Map([['kHome', {}]])],
  ['map02', new Map([['kA', {}], ['kB', {}]])],
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
        ['map05', new Map([['kB', {}], ['kC', {}]])],
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter ./apps/web exec vitest run src/services/share_link_resolve.test.ts`
Expected: FAIL — cannot resolve `./share_link_resolve`.

- [ ] **Step 3: Implement the resolver**

Create `apps/web/src/services/share_link_resolve.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter ./apps/web exec vitest run src/services/share_link_resolve.test.ts`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/share_link_resolve.ts apps/web/src/services/share_link_resolve.test.ts
git commit -m "feat(web): add pure resolver for cross-map select placement"
```

---

## Task 3: MobX store — `share_select_store.ts`

**Files:**
- Create: `apps/web/src/services/share_select_store.ts`
- Test: `apps/web/src/services/share_select_store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/services/share_select_store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { ShareSelectStore } from './share_select_store';

describe('ShareSelectStore', () => {
  it('setSelect with keys shows the strip', () => {
    const store = new ShareSelectStore();
    store.setSelect(['a', 'b']);
    expect(store.selectKeys).toEqual(['a', 'b']);
    expect(store.visible).toBe(true);
  });

  it('setSelect with empty keys keeps the strip hidden', () => {
    const store = new ShareSelectStore();
    store.setSelect([]);
    expect(store.selectKeys).toEqual([]);
    expect(store.visible).toBe(false);
  });

  it('close hides the strip and clears keys', () => {
    const store = new ShareSelectStore();
    store.setSelect(['a']);
    store.close();
    expect(store.visible).toBe(false);
    expect(store.selectKeys).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter ./apps/web exec vitest run src/services/share_select_store.test.ts`
Expected: FAIL — cannot resolve `./share_select_store`.

- [ ] **Step 3: Implement the store**

Create `apps/web/src/services/share_select_store.ts`:

```ts
import { action, observable } from 'mobx';

export class ShareSelectStore {
  @observable accessor selectKeys: string[] = [];
  @observable accessor visible: boolean = false;

  @action
  setSelect(keys: string[]): void {
    this.selectKeys = keys;
    this.visible = keys.length > 0;
  }

  @action
  close(): void {
    this.selectKeys = [];
    this.visible = false;
  }
}

export const shareSelectStore = new ShareSelectStore();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter ./apps/web exec vitest run src/services/share_select_store.test.ts`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/share_select_store.ts apps/web/src/services/share_select_store.test.ts
git commit -m "feat(web): add shareSelectStore for bottom select strip state"
```

---

## Task 4: `OperationList` — add `position` prop

**Files:**
- Modify: `apps/web/src/components/themes/endfield/components/topbar/operation_list.tsx`

- [ ] **Step 1: Add the prop and switch positioning**

Replace the component body so the outer `motion.div` positioning depends on `position` (default `'top'` keeps existing behavior). Full new file:

```tsx
import { cn } from '@endfieldmap/tools';
import { useWindow } from '@endfieldmap/web-components';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

export const OperationList = ({
  children,
  open,
  className,
  position = 'top',
}: {
  children: React.ReactNode;
  open: boolean;
  className?: string;
  position?: 'top' | 'bottom';
}) => {
  const currentWindow = useWindow();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 pointer-events-none overflow-x-auto z-2 max-w-[calc(100vw-3rem)] scrollbar-hide',
            position === 'bottom' ? 'bottom-6' : 'top-13'
          )}
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: 'auto',
            opacity: 1,
            transition: { duration: 0.3, ease: 'easeInOut' },
          }}
          exit={{
            width: 0,
            opacity: 0,
          }}
        >
          <div className={cn('flex items-center justify-center gap-1 *:pointer-events-auto', 'min-w-max', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    currentWindow.document.body
  );
};
```

- [ ] **Step 2: Verify typecheck (existing top callers unaffected)**

Run: `pnpm --filter ./apps/web typecheck`
Expected: PASS (no new errors; `position` defaults to `'top'`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/themes/endfield/components/topbar/operation_list.tsx
git commit -m "feat(web): add position prop to OperationList (top|bottom)"
```

---

## Task 5: Chip component — `share_select/chip.tsx`

**Files:**
- Create: `apps/web/src/components/themes/endfield/ui/share_select/chip.tsx`

- [ ] **Step 1: Implement the chip**

Create `apps/web/src/components/themes/endfield/ui/share_select/chip.tsx`:

```tsx
import { type EntityInfoStats } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { useEntityName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';

interface ShareSelectChipProps {
  stats: EntityInfoStats;
  /** category not present on the current map */
  isOffMap: boolean;
  /** dimmed when present on the current map but currently hidden */
  dimmed: boolean;
  onClick: () => void;
}

export const ShareSelectChip = observer(({ stats, isOffMap, dimmed, onClick }: ShareSelectChipProps) => {
  const { name } = useEntityName(stats);
  const iconSrc = getEntityIcon(stats.category, stats.entityInfo.pic);

  return (
    <ButtonWithAudio
      onClick={onClick}
      soundType={SoundType.TICK}
      className={cn(
        'relative flex items-center gap-1 rounded-full select-none',
        'bg-[#1d1d1d] border-[0.5px] border-[#898989]/30 text-[#cccccc] text-xs',
        'px-2 py-1 hover:bg-[#222222] transition-colors',
        dimmed && !isOffMap && 'opacity-40'
      )}
    >
      <div className="w-5 h-5 shrink-0 rounded-full bg-white/5 flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt={name} className="w-full h-full object-contain" />}
      </div>
      <span className="max-w-[8rem] truncate">{name}</span>
      {isOffMap && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#fffa00] ring-2 ring-[#1d1d1d]" />
      )}
    </ButtonWithAudio>
  );
});
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter ./apps/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/themes/endfield/ui/share_select/chip.tsx
git commit -m "feat(web): add ShareSelectChip with off-map badge"
```

---

## Task 6: Alert body — `share_select/alert_content.tsx`

**Files:**
- Create: `apps/web/src/components/themes/endfield/ui/share_select/alert_content.tsx`

- [ ] **Step 1: Implement the alert content**

Create `apps/web/src/components/themes/endfield/ui/share_select/alert_content.tsx`:

```tsx
import { type EntityInfoStats } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { useEntityName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';

export interface ShareSelectAlertItem {
  stats: EntityInfoStats;
  /** already-translated map display name */
  mapName: string;
}

const Row = ({ stats, mapName }: ShareSelectAlertItem) => {
  const { t } = useTranslation();
  const { name } = useEntityName(stats);
  const iconSrc = getEntityIcon(stats.category, stats.entityInfo.pic);
  return (
    <li className="flex items-center gap-2">
      <div className="w-5 h-5 shrink-0 rounded-full bg-white/5 flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt={name} className="w-full h-full object-contain" />}
      </div>
      <span className="text-[#e5e5e5]">{name}</span>
      <span className="text-[#8a8a8a]">·</span>
      <span className="text-[#8a8a8a]">{t('share_link.located_at', { map: mapName })}</span>
    </li>
  );
};

export const ShareSelectAlertContent = ({ title, items }: { title: string; items: ShareSelectAlertItem[] }) => {
  return (
    <div className={cn('text-sm text-[#cccccc] text-left')}>
      <div className="mb-2">{title}</div>
      <ul className="flex flex-col gap-1.5 max-h-60 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <Row key={item.stats.uniqueKey} {...item} />
        ))}
      </ul>
    </div>
  );
};
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter ./apps/web typecheck`
Expected: FAIL — `share_link.located_at` not yet in i18n types. This is expected; it resolves in Task 10. (If you prefer green-at-every-step, run Task 10 before this step's typecheck.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/themes/endfield/ui/share_select/alert_content.tsx
git commit -m "feat(web): add ShareSelectAlertContent for off-map prompt body"
```

---

## Task 7: Bottom strip — `share_select/index.tsx`

**Files:**
- Create: `apps/web/src/components/themes/endfield/ui/share_select/index.tsx`

- [ ] **Step 1: Implement `ShareSelectBar`**

Create `apps/web/src/components/themes/endfield/ui/share_select/index.tsx`:

```tsx
import { type EntityInfoStats } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';
import { shareSelectStore } from '@/services/share_select_store';
import { urlStateManager } from '@/services/url_state';
import { ShareSelectChip } from '@themes/endfield/ui/share_select/chip';

interface ChipModel {
  key: string;
  stats: EntityInfoStats;
  isOffMap: boolean;
  dimmed: boolean;
}

export const ShareSelectBar = observer(() => {
  const { adapter } = useAdapter();
  const { t } = useTranslation();

  const dataManager = adapter.entityController.dataManager;
  const currentMapId = service.dataService.mapDataService.mapStateDataService.currentMap.value;

  const findHomeMap = (key: string): string | undefined => {
    for (const [mapId, groups] of dataManager.mapData) {
      if (groups.has(key)) return mapId;
    }
    return undefined;
  };

  const chips: ChipModel[] = [];
  for (const key of shareSelectStore.selectKeys) {
    const onCurrent = dataManager.mapData.get(currentMapId)?.get(key);
    if (onCurrent) {
      chips.push({ key, stats: onCurrent.stats, isOffMap: false, dimmed: !onCurrent.stats.visible });
      continue;
    }
    const homeMapId = findHomeMap(key);
    if (homeMapId) {
      const group = dataManager.mapData.get(homeMapId)?.get(key);
      if (group) chips.push({ key, stats: group.stats, isOffMap: true, dimmed: false });
    }
    // keys on no map (unknown) are skipped
  }

  const handleClick = (chip: ChipModel) => {
    if (chip.isOffMap) {
      const homeMapId = findHomeMap(chip.key);
      if (homeMapId) service.dataService.mapDataService.mapStateDataService.setCurrentMap(homeMapId);
    } else {
      service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(
        currentMapId,
        chip.key,
        !chip.stats.visible
      );
    }
  };

  const handleClose = () => {
    shareSelectStore.close();
    urlStateManager.removeParam('select');
  };

  return (
    <OperationList open={shareSelectStore.visible && chips.length > 0} position="bottom" className="flex gap-1.5">
      {chips.map((chip) => (
        <ShareSelectChip
          key={chip.key}
          stats={chip.stats}
          isOffMap={chip.isOffMap}
          dimmed={chip.dimmed}
          onClick={() => handleClick(chip)}
        />
      ))}
      <ButtonWithAudio
        onClick={handleClose}
        soundType={SoundType.TICK}
        aria-label={t('share_link.close')}
        className="shrink-0 w-6 h-6 rounded-full bg-[#1d1d1d] border-[0.5px] border-[#898989]/30 text-[#cccccc] hover:bg-[#222222] flex items-center justify-center text-xs"
      >
        ✕
      </ButtonWithAudio>
    </OperationList>
  );
});
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter ./apps/web typecheck`
Expected: FAIL only on `share_link.close` i18n key (resolves in Task 10); no other errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/themes/endfield/ui/share_select/index.tsx
git commit -m "feat(web): add ShareSelectBar bottom strip with chip interactions"
```

---

## Task 8: Mount `ShareSelectBar`

**Files:**
- Modify: `apps/web/src/Map.tsx` (around line 60, the `OperationTip` Suspense block)

- [ ] **Step 1: Import and render**

Add the import near the other component imports in `apps/web/src/Map.tsx`:

```tsx
import { ShareSelectBar } from '@themes/endfield/ui/share_select';
```

Then add a render block immediately after the `OperationTip` Suspense block:

```tsx
          {/* 操作提示组件 */}
          <Suspense>
            <ThemedComponents.map.OperationTip />
          </Suspense>

          {/* 分享 select 底部标签条 */}
          <Suspense>
            <ShareSelectBar />
          </Suspense>
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter ./apps/web typecheck`
Expected: FAIL only on the two i18n keys from Tasks 6/7 (resolved in Task 10).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/Map.tsx
git commit -m "feat(web): mount ShareSelectBar in map UI layer"
```

---

## Task 9: Rewrite `applyShareLinkParams` (rename to `.tsx`)

**Files:**
- Rename + Modify: `apps/web/src/services/share_link.ts` → `apps/web/src/services/share_link.tsx`

- [ ] **Step 1: Rename the file (preserve history)**

```bash
git mv apps/web/src/services/share_link.ts apps/web/src/services/share_link.tsx
```

(Imports elsewhere use extensionless `@/services/share_link`, so they keep resolving.)

- [ ] **Step 2: Replace the file contents**

Overwrite `apps/web/src/services/share_link.tsx` with:

```tsx
import { logger } from '@endfieldmap/tools';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { contextMenuManager } from '@/services/context_menu_manager';
import { buildMapsByKey, resolveSelectPlacement } from '@/services/share_link_resolve';
import { shareSelectStore } from '@/services/share_select_store';
import { urlStateManager } from '@/services/url_state';
import {
  ShareSelectAlertContent,
  type ShareSelectAlertItem,
} from '@themes/endfield/ui/share_select/alert_content';

function registerShareLinkParams(): void {
  urlStateManager.register({
    key: 'map',
    parse: (v) => v,
    serialize: (v) => v as string,
  });
  urlStateManager.register({
    key: 'id',
    parse: (v) => parseInt(v, 10),
    serialize: (v) => String(v),
  });
  urlStateManager.register({
    key: 'select',
    parse: (v) => v.split(',').filter(Boolean),
    serialize: (v) => (v as string[]).join(','),
  });
}

export async function applyShareLinkParams(): Promise<void> {
  const params = urlStateManager.readInitialParams();
  const mapId = params.map as string | undefined;
  const entityId = params.id as number | undefined;
  const selectKeys = params.select as string[] | undefined;

  const adapter = service.adapterRegistry?.adapter;
  if (!adapter) return;

  const mapState = service.dataService.mapDataService.mapStateDataService;
  const entityData = service.dataService.mapDataService.entityDataService;
  const dataManager = adapter.entityController.dataManager;
  const validMapIds = adapter.mapController.dataManager.mapIds;

  const translate = (key: string, opts?: Record<string, unknown>): string =>
    service.i18nService.translate(key, { ns: 'common', ...opts });

  const mapDisplayName = (mId: string): string => {
    const name = adapter.mapController.dataManager.getMapData(mId)?.name ?? mId;
    return service.i18nService.translate('lang:' + name, { defaultValue: name });
  };

  const applyVisibleOn = (mId: string, keys: string[]): void => {
    const groups = dataManager.mapData.get(mId);
    for (const key of keys) {
      if (groups?.has(key)) entityData.setEntityGroupVisibility(mId, key, true);
    }
  };

  // 1. map
  if (mapId) {
    if (!validMapIds.includes(mapId)) {
      logger.warn('[ShareLink] Invalid map ID:', mapId);
      return;
    }
    mapState.setCurrentMap(mapId);
  }
  let targetMapId = mapId ?? mapState.currentMap.value;

  // 2. on-map select visibility
  if (selectKeys && selectKeys.length > 0) applyVisibleOn(targetMapId, selectKeys);

  // 3. id (may switch map); re-read current map afterwards
  let idAnchored = false;
  if (mapId && entityId !== undefined && !isNaN(entityId)) {
    const found = await service.dataService.mapDataService.moveToEntity(entityId, true, true);
    if (found) {
      idAnchored = true;
    } else {
      logger.warn('[ShareLink] Entity not found:', entityId);
    }
    targetMapId = mapState.currentMap.value;
    if (selectKeys && selectKeys.length > 0) applyVisibleOn(targetMapId, selectKeys);
  }

  // 4 & 5. cross-map resolution + alerts
  if (selectKeys && selectKeys.length > 0) {
    const resolution = resolveSelectPlacement(buildMapsByKey(dataManager.mapData), selectKeys, targetMapId, idAnchored);

    if (resolution.offMap.length > 0) {
      const items: ShareSelectAlertItem[] = [];
      for (const { key, homeMaps } of resolution.offMap) {
        const stats = dataManager.mapData.get(homeMaps[0])?.get(key)?.stats;
        if (stats) items.push({ stats, mapName: mapDisplayName(homeMaps[0]) });
      }

      if (resolution.switchMode === 'auto' && resolution.switchTarget) {
        mapState.setCurrentMap(resolution.switchTarget);
        applyVisibleOn(resolution.switchTarget, selectKeys);
        alert.info({
          content: <ShareSelectAlertContent title={translate('share_link.not_on_map_switched')} items={items} />,
        });
      } else if (resolution.switchMode === 'ask' && resolution.switchTarget) {
        const target = resolution.switchTarget;
        const ok = await alert.confirm({
          content: (
            <ShareSelectAlertContent
              title={translate('share_link.not_on_map_ask', { map: mapDisplayName(target) })}
              items={items}
            />
          ),
        });
        if (ok) {
          mapState.setCurrentMap(target);
          applyVisibleOn(target, selectKeys);
        }
      } else {
        alert.info({
          content: <ShareSelectAlertContent title={translate('share_link.not_on_current_map')} items={items} />,
        });
      }
    }

    if (resolution.unknown.length > 0) {
      logger.warn('[ShareLink] Unknown select keys (on no map):', resolution.unknown);
    }

    // 6. populate the bottom strip
    shareSelectStore.setSelect(selectKeys);
  }
}

export function buildShareLink(mapId: string, levelLogicId?: number, entityDataIdKeys?: string[]): string {
  const url = new URL(window.location.href);
  url.searchParams.set('map', mapId);

  if (levelLogicId !== undefined) {
    url.searchParams.set('id', String(levelLogicId));
  } else {
    url.searchParams.delete('id');
  }

  if (entityDataIdKeys && entityDataIdKeys.length > 0) {
    url.searchParams.set('select', entityDataIdKeys.join(','));
  } else {
    url.searchParams.delete('select');
  }

  return url.toString();
}

export async function copyShareLink(link: string, t: (key: string) => string): Promise<void> {
  try {
    await navigator.clipboard.writeText(link);
    alert.info(t('share_link.copy_success'));
  } catch {
    alert.info(t('share_link.copy_failed'));
  }
}

function getVisibleEntityKeys(mapId: string): string[] {
  const adapter = service.adapterRegistry?.adapter;
  if (!adapter) return [];
  return adapter.entityController.currentStats
    .filter((s) => s.mapId === mapId && s.visible)
    .map((s) => s.entityDataIdKey);
}

function registerContextMenuItem(): void {
  contextMenuManager.register({
    id: 'share-link',
    label: 'context_menu.share',
    order: 100,
    visible: (ctx) => ctx.type === 'entity' && !!ctx.entities && ctx.entities.length > 0,
    action: (ctx) => {
      const entity = ctx.entities?.[0];
      if (!entity) return;
      const visibleKeys = getVisibleEntityKeys(entity.mapId);
      const link = buildShareLink(entity.mapId, entity.id, visibleKeys);
      const t = service.i18nService.translate;
      copyShareLink(link, (key: string) => t(key, { ns: 'common' }));
    },
  });
}

export function initShareLink(): void {
  registerShareLinkParams();
  registerContextMenuItem();
}
```

- [ ] **Step 3: Verify typecheck (still expects i18n keys until Task 10)**

Run: `pnpm --filter ./apps/web typecheck`
Expected: FAIL only on the new `share_link.*` i18n keys; no structural/type errors. (Green after Task 10.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/share_link.tsx
git commit -m "feat(web): resolve cross-map select with alert + strip in applyShareLinkParams"
```

---

## Task 10: i18n keys (14 locales) + regenerate types

**Files:**
- Modify: `packages/map-service/src/locales/<locale>/common.json` ×14
- Regenerate: `packages/map-service/src/@types/resources.d.ts`

- [ ] **Step 1: Add 5 keys to each locale's `share_link` object**

In every `packages/map-service/src/locales/<locale>/common.json`, add these keys **inside the existing `"share_link"` object** (alongside `copy_link`, etc.). Values per locale:

| locale | not_on_current_map | not_on_map_switched | not_on_map_ask | located_at | close |
|---|---|---|---|---|---|
| zh-CN | 该标点类型不在当前地图 | 该标点类型不在当前地图，已为你切换至所在地图 | 部分标点类型不在当前地图，是否切换到〔{{map}}〕查看？ | 位于 {{map}} | 关闭 |
| zh-TW | 該標點類型不在目前地圖 | 該標點類型不在目前地圖，已為你切換至所在地圖 | 部分標點類型不在目前地圖，是否切換到〔{{map}}〕查看？ | 位於 {{map}} | 關閉 |
| en-US | This marker type isn't on the current map | This marker type isn't on the current map. Switched to the map where it exists. | Some marker types aren't on the current map. Switch to {{map}} to view them? | on {{map}} | Close |
| ja-JP | このマーカー種別は現在のマップにありません | このマーカー種別は現在のマップにありません。存在するマップに切り替えました。 | 一部のマーカー種別は現在のマップにありません。{{map}} に切り替えて表示しますか？ | {{map}} にあります | 閉じる |
| ko-KR | 이 마커 유형은 현재 지도에 없습니다 | 이 마커 유형은 현재 지도에 없어 해당 지도로 전환했습니다. | 일부 마커 유형이 현재 지도에 없습니다. {{map}}(으)로 전환하여 볼까요? | {{map}}에 있음 | 닫기 |
| de-DE | Dieser Markierungstyp ist nicht auf der aktuellen Karte | Dieser Markierungstyp ist nicht auf der aktuellen Karte. Zur entsprechenden Karte gewechselt. | Einige Markierungstypen sind nicht auf der aktuellen Karte. Zu {{map}} wechseln, um sie anzuzeigen? | auf {{map}} | Schließen |
| es-MX | Este tipo de marcador no está en el mapa actual | Este tipo de marcador no está en el mapa actual. Se cambió al mapa donde existe. | Algunos tipos de marcador no están en el mapa actual. ¿Cambiar a {{map}} para verlos? | en {{map}} | Cerrar |
| fr-FR | Ce type de marqueur n'est pas sur la carte actuelle | Ce type de marqueur n'est pas sur la carte actuelle. Basculé vers la carte où il existe. | Certains types de marqueurs ne sont pas sur la carte actuelle. Basculer vers {{map}} pour les voir ? | sur {{map}} | Fermer |
| id-ID | Jenis penanda ini tidak ada di peta saat ini | Jenis penanda ini tidak ada di peta saat ini. Beralih ke peta tempatnya berada. | Beberapa jenis penanda tidak ada di peta saat ini. Beralih ke {{map}} untuk melihatnya? | di {{map}} | Tutup |
| it-IT | Questo tipo di segnaposto non è sulla mappa corrente | Questo tipo di segnaposto non è sulla mappa corrente. Passato alla mappa in cui esiste. | Alcuni tipi di segnaposto non sono sulla mappa corrente. Passare a {{map}} per vederli? | su {{map}} | Chiudi |
| pt-BR | Este tipo de marcador não está no mapa atual | Este tipo de marcador não está no mapa atual. Alternado para o mapa onde ele existe. | Alguns tipos de marcador não estão no mapa atual. Mudar para {{map}} para vê-los? | em {{map}} | Fechar |
| ru-RU | Этого типа меток нет на текущей карте | Этого типа меток нет на текущей карте. Выполнен переход на карту, где они есть. | Некоторых типов меток нет на текущей карте. Перейти на {{map}}, чтобы посмотреть? | на {{map}} | Закрыть |
| th-TH | ไม่มีหมุดประเภทนี้บนแผนที่ปัจจุบัน | ไม่มีหมุดประเภทนี้บนแผนที่ปัจจุบัน เปลี่ยนไปยังแผนที่ที่มีหมุดนี้แล้ว | หมุดบางประเภทไม่อยู่บนแผนที่ปัจจุบัน สลับไปที่ {{map}} เพื่อดูหรือไม่? | อยู่ที่ {{map}} | ปิด |
| vi-VN | Loại điểm đánh dấu này không có trên bản đồ hiện tại | Loại điểm đánh dấu này không có trên bản đồ hiện tại. Đã chuyển sang bản đồ có nó. | Một số loại điểm đánh dấu không có trên bản đồ hiện tại. Chuyển sang {{map}} để xem? | ở {{map}} | Đóng |

Example — `zh-CN/common.json` `share_link` becomes:

```json
  "share_link": {
    "copy_link": "复制分享链接",
    "copy_success": "链接已复制到剪贴板",
    "copy_failed": "复制失败",
    "select_categories": "选择要包含的分类",
    "confirm_copy": "复制链接",
    "select_more": "选择更多分类",
    "not_on_current_map": "该标点类型不在当前地图",
    "not_on_map_switched": "该标点类型不在当前地图，已为你切换至所在地图",
    "not_on_map_ask": "部分标点类型不在当前地图，是否切换到〔{{map}}〕查看？",
    "located_at": "位于 {{map}}",
    "close": "关闭"
  },
```

- [ ] **Step 2: Regenerate i18n types**

Run: `pnpm lng:type`
Expected: `packages/map-service/src/@types/resources.d.ts` updated; no errors.

- [ ] **Step 3: Verify full typecheck is now green**

Run: `pnpm --filter ./apps/web typecheck`
Expected: PASS — the `share_link.*` keys now exist.

- [ ] **Step 4: Commit**

```bash
git add packages/map-service/src/locales packages/map-service/src/@types/resources.d.ts
git commit -m "feat(i18n): add cross-map select prompt keys for all 14 locales"
```

---

## Task 11: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `pnpm --filter ./apps/web lint`
Expected: PASS (no errors). Fix import order with `pnpm --filter ./apps/web lint:fix` if `simple-import-sort` warns, then re-commit.

- [ ] **Step 2: Unit tests**

Run: `pnpm --filter ./apps/web test`
Expected: PASS — `share_link_resolve.test.ts` (9) + `share_select_store.test.ts` (3).

- [ ] **Step 3: Typecheck (whole repo touched parts)**

Run: `pnpm --filter ./apps/web typecheck && pnpm --filter ./packages/map-service typecheck`
Expected: PASS.

- [ ] **Step 4: Build smoke**

Run: `pnpm --filter ./apps/web build`
Expected: build succeeds.

- [ ] **Step 5: Manual smoke (dev server)**

Run: `pnpm dev:web`, then visit these URLs (substitute real `map`/`id`/`select` values from the dataset):

1. `?map=<mapA>&select=<keyOnMapA>` → strip shows the chip, no badge, no alert.
2. `?map=<mapA>&select=<keyOnlyOnMapB>` (single) → alert "已切换至所在地图", map switches to B, chip un-badged after switch.
3. `?map=<mapA>&select=<keyOnMapA>,<keyOnlyOnMapB>` (multiple) → confirm dialog offering `<mapB>`; confirm switches, cancel stays with a badged chip for the off-map key.
4. `?map=<mapA>&id=<idOnMapA>&select=<keyOnlyOnMapB>` → entity opens on A, **info** alert (no switch), off-map chip badged.
5. Click a badged chip → switches to its map. Click an on-map chip → toggles its visibility. Click ✕ → strip hides and `select` disappears from the URL.
6. On a mobile viewport, confirm the bottom strip doesn't overlap bottom controls; if it does, bump `bottom-6` in `operation_list.tsx` (e.g. to `bottom-20` under a mobile check) and re-verify.

- [ ] **Step 6: Restore the stashed dev-tools WIP location note**

The `trajectory_path` dev-tools WIP is in `git stash@{0}` ("wip: dev-tools 轨迹路径绘制工具"). It is unrelated to this feature; leave it stashed (do not pop into this branch).

---

## Self-Review notes (author)

- **Spec coverage:** §2.1 switch policy → Tasks 2/9; §2.2 chip interaction → Tasks 5/7; §2.3 lifecycle/close → Tasks 3/7/9; alert UX §4 → Tasks 6/9; strip §5 → Tasks 4/5/7/8; i18n §6 → Task 10; tests §7 → Tasks 2/3; edge cases §8 (unknown keys, id precedence, multi-home) → Tasks 2/9.
- **Type consistency:** `SelectResolution` / `SelectHomeInfo` (Task 2) consumed unchanged in Task 9; `ShareSelectAlertItem` (Task 6) imported in Task 9; `ShareSelectChip` props (Task 5) match call site (Task 7).
- **Known intermediate red:** Tasks 6–9 reference i18n keys added in Task 10, so typecheck for those is only green after Task 10. Execute Task 10 before the final typecheck. (Alternative: reorder Task 10 before Task 6.)
