# Share Link Feature Design

## Overview

Implement shareable URL deep-links for the map application supporting the format:

```
?map=map01&id=levelLogicId&select=entityDataIdKey1,entityDataIdKey2,entityDataIdKey3
```

This allows users to share links that open a specific map, activate an entity's popup, and ensure specific entity categories are visible in the left panel.

## URL Parameter Semantics

| Parameter | Required | Depends On | Description |
|-----------|----------|------------|-------------|
| `map` | Yes (base) | — | Map ID (e.g., `map01`) to switch to |
| `id` | Optional | `map` | `levelLogicId` of the entity to activate (open popup + pan to) |
| `select` | Optional | — | Comma-separated `entityDataIdKey` values to make visible |

**Behavior rules:**
- `select` is **additive**: it ensures the listed categories are visible without hiding other already-visible categories.
- `id` requires `map` — a `levelLogicId` is only unique within a specific map.
- `select` can be used independently of `map` and `id`.
- Parameters are **preserved** in the URL after being applied (no cleanup via `replaceState`).
- If `id` refers to a nonexistent entity, silently skip it; still apply `map` and `select`.

## Module 1: URL State Manager

**File:** `apps/web/src/services/url_state.ts`

A generic, registry-based URL parameter management service. Each feature module registers handlers for its own parameters.

### Interface

```typescript
interface URLParamHandler {
  key: string;
  parse: (value: string) => unknown;
  serialize: (value: unknown) => string;
}

class URLStateManager {
  private handlers: Map<string, URLParamHandler>;

  register(handler: URLParamHandler): void;
  getParam<T>(key: string): T | null;
  setParam(key: string, value: unknown): void;
  setParams(params: Record<string, unknown>): void;
  removeParam(key: string): void;
  readInitialParams(): Record<string, unknown>;
}
```

### Behavior

- `setParam` / `setParams` use `history.replaceState` to update the URL without triggering a page reload or adding history entries.
- `readInitialParams()` reads `window.location.search` and returns parsed values for all registered handlers.
- Unregistered parameters in the URL are preserved as-is (e.g., `__DEV__`, `__SCAN__`).

### Initialization Timing

Called after `service.dataService.mapDataService.initData()` completes in `MapService._init()`, so map/entity data is available when share link params are applied.

## Module 2: Context Menu Framework

### ContextMenuManager

**File:** `apps/web/src/services/context_menu_manager.ts`

A MobX-based registry for context menu items with observable open/close state.

```typescript
interface ContextMenuItem {
  id: string;
  label: string;               // i18n key
  icon?: React.ComponentType;
  order: number;
  visible?: (context: ContextMenuContext) => boolean;
  action: (context: ContextMenuContext) => void;
}

interface ContextMenuContext {
  type: 'entity' | 'connection' | 'map';
  entities?: DataInstance[];
  pixel: [number, number];
  coordinate?: MapCoordinate;
  originalEvent: MouseEvent;
}

class ContextMenuManager {
  @observable isOpen: boolean;
  @observable context: ContextMenuContext | null;

  register(item: ContextMenuItem): () => void;
  getVisibleItems(context: ContextMenuContext): ContextMenuItem[];
  open(context: ContextMenuContext): void;
  close(): void;
}
```

### Integration with Existing Events

Modify `apps/web/src/services/context_menu.ts`:
- `MAP_EVENT.ENTITY_CONTEXT_MENU` → call `contextMenuManager.open({ type: 'entity', ... })`
- `MAP_EVENT.CONNECTION_CONTEXT_MENU` → call `contextMenuManager.open({ type: 'connection', ... })`
- `MAP_EVENT.MAP_CONTEXT_MENU` → call `contextMenuManager.open({ type: 'map', ... })`
- Prevent default browser context menu via `originalEvent.preventDefault()`.
- Keep existing `MAP_EVENT.ENTITY_MIDDLE_CLICK` handler unchanged.

### ContextMenu UI Component (PC only)

**Directory:** `apps/web/src/components/themes/endfield/ui/context_menu/`

- `index.tsx` — PC-only context menu component (no mobile version for now).
- Uses `createPortal` into a document-level container.
- Positioned with `position: fixed` at `context.pixel` coordinates (mouse position).
- Viewport clamping: if the menu would overflow the viewport edge, shift it inward.
- Dismiss: click outside, Escape key, or scroll.
- Animation: `motion` fade + scale, consistent with popup style.
- Styling: endfield dark theme — dark background (`#1a1a1a`-ish), gold/amber border, matching popup aesthetics.

## Module 3: Share Link Service

**File:** `apps/web/src/services/share_link.ts`

Bridges the URL State Manager with map business logic.

### Consuming Share Links (Parse Side)

Called once during `MapService._init()`, after adapter and data are ready:

1. Register URL param handlers for `map`, `id`, `select` with URLStateManager.
2. Read initial params.
3. Apply in order:
   - **map**: `service.dataService.mapDataService.mapStateDataService.setCurrentMap(mapId)`
   - **select**: For each key, call `service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(mapId, key, true)`. The `mapId` comes from the `map` param if present, otherwise the current map.
   - **id**: Call `service.dataService.mapDataService.moveToEntity(id, true, true)` — this already handles cross-map switching, visibility toggle, active feature setting, and animation.

**Error handling:** If `id` entity is not found, skip silently. If `map` is invalid, skip all params.

### Generating Share Links (Build Side)

```typescript
function buildShareLink(
  mapId: string,
  levelLogicId?: number,
  entityDataIdKeys?: string[]
): string
```

- Constructs the full URL from `window.location.origin + window.location.pathname`.
- Appends `?map=...` always; `&id=...` if provided; `&select=...` if non-empty array.
- Preserves other existing URL params (e.g., `__DEV__`).

### Context Menu Registration

Register a "Copy Share Link" menu item:
- `id`: `'share-link'`
- `visible`: `context.type === 'entity' && context.entities && context.entities.length > 0`
- `action`: Uses the first entity's `mapId` + `levelLogicId` + **all currently visible** entity categories on that map to build and copy the link.
- No category selection popover (quick action for context menu).

## Module 4: Popup Share Button

**File:** `apps/web/src/components/themes/endfield/ui/popup/left_content/buttons/share.tsx`

### Button

- Location: In the popup header button row, after MarkButton, before CloseButton.
- Icon: A share/link icon.
- Tooltip: `t('share.copy_link')`.
- Follows existing `ButtonWithAudio` + `Tooltip` pattern.

### Category Selection Popover

Clicking the share button opens a downward Popover containing:

1. **Checkbox list**: All `entityDataIdKey` categories available on the current map.
   - Each item shows the category icon + translated name.
   - Default checked: categories currently visible on the map.
2. **"Copy Link" button** at the bottom.
   - Calls `buildShareLink(mapId, levelLogicId, checkedKeys)`.
   - Copies to clipboard via `navigator.clipboard.writeText()`.
   - Shows `alert.info({ content: t('share.copy_success') })`.
   - Closes the Popover.

### Styling

- Popover: dark background, gold border, matching endfield theme.
- Max height with scroll for maps with many categories.
- Checkbox items: icon + label, hover highlight.

## Module 5: i18n Strings

Add to `common` namespace across all 14 locales in `packages/map-service/src/locales/*/common.json`:

| Key | zh-CN | en-US |
|-----|-------|-------|
| `share.copy_link` | 复制分享链接 | Copy Share Link |
| `share.copy_success` | 链接已复制到剪贴板 | Link copied to clipboard |
| `share.copy_failed` | 复制失败 | Copy failed |
| `share.select_categories` | 选择要包含的分类 | Select categories to include |
| `share.confirm_copy` | 复制链接 | Copy Link |
| `context_menu.share` | 复制分享链接 | Copy Share Link |

Other locales (de-DE, es-MX, fr-FR, id-ID, it-IT, ja-JP, ko-KR, pt-BR, ru-RU, th-TH, vi-VN, zh-TW) need corresponding translations.

After editing, run `pnpm lng:type` to regenerate type definitions.

## Initialization Order

Within `MapService._init()` (after adapter registration and entity data loading):

1. Create and export `urlStateManager` singleton.
2. Create and export `contextMenuManager` singleton.
3. Call `initShareLink(urlStateManager, contextMenuManager)` which:
   - Registers URL param handlers.
   - Registers context menu item.
   - Reads and applies initial URL params.
4. Modify `initContextMenuEventListeners` to bridge events → `contextMenuManager.open()`.

## File Inventory

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/services/url_state.ts` | **New** | URLStateManager class |
| `apps/web/src/services/context_menu_manager.ts` | **New** | ContextMenuManager class |
| `apps/web/src/services/share_link.ts` | **New** | Share link parse/generate + registrations |
| `apps/web/src/services/context_menu.ts` | **Modify** | Bridge MAP_EVENTs → contextMenuManager.open() |
| `apps/web/src/services/map.ts` | **Modify** | Init url_state, context_menu_manager, share_link |
| `apps/web/src/components/themes/endfield/ui/context_menu/index.tsx` | **New** | ContextMenu React component (PC) |
| `apps/web/src/components/themes/endfield/ui/popup/left_content/buttons/share.tsx` | **New** | ShareButton + category Popover |
| `apps/web/src/components/themes/endfield/ui/popup/left.tsx` | **Modify** | Add ShareButton to header |
| `packages/map-service/src/locales/*/common.json` (×14) | **Modify** | Add share/context_menu i18n keys |
| `packages/map-service/src/@types/resources.d.ts` | **Regenerate** | Via `pnpm lng:type` |
