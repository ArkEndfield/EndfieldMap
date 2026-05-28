# Share Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement shareable URL deep-links (`?map=...&id=...&select=...`) with a URL State Manager, Context Menu framework, and Share UI in both popup and context menu.

**Architecture:** Registry-based URL State Manager for generic URL param handling. MobX-based Context Menu Manager with registered menu items and a Portal-rendered PC-only context menu component. Share Link Service bridges URL parsing/generation with map business logic. Share button in popup header with category-selection popover; quick-copy in context menu.

**Tech Stack:** TypeScript, React 19, MobX (class decorators `2023-11`), motion (framer-motion successor), i18next, `@endfieldmap/web-components` (ButtonWithAudio, Tooltip, ShareIcon, shortcutService)

---

### Task 1: i18n — Add share/context_menu keys to all 14 locales

**Files:**
- Modify: `packages/map-service/src/locales/zh-CN/common.json`
- Modify: `packages/map-service/src/locales/en-US/common.json`
- Modify: `packages/map-service/src/locales/de-DE/common.json`
- Modify: `packages/map-service/src/locales/es-MX/common.json`
- Modify: `packages/map-service/src/locales/fr-FR/common.json`
- Modify: `packages/map-service/src/locales/id-ID/common.json`
- Modify: `packages/map-service/src/locales/it-IT/common.json`
- Modify: `packages/map-service/src/locales/ja-JP/common.json`
- Modify: `packages/map-service/src/locales/ko-KR/common.json`
- Modify: `packages/map-service/src/locales/pt-BR/common.json`
- Modify: `packages/map-service/src/locales/ru-RU/common.json`
- Modify: `packages/map-service/src/locales/th-TH/common.json`
- Modify: `packages/map-service/src/locales/vi-VN/common.json`
- Modify: `packages/map-service/src/locales/zh-TW/common.json`
- Regenerate: `packages/map-service/src/@types/resources.d.ts`

- [ ] **Step 1: Add keys to zh-CN/common.json**

Append these keys before the closing `}` of the root JSON object in `packages/map-service/src/locales/zh-CN/common.json`:

```json
"share": {
  "copy_link": "复制分享链接",
  "copy_success": "链接已复制到剪贴板",
  "copy_failed": "复制失败",
  "select_categories": "选择要包含的分类",
  "confirm_copy": "复制链接"
},
"context_menu": {
  "share": "复制分享链接"
}
```

- [ ] **Step 2: Add keys to en-US/common.json**

Same structure:

```json
"share": {
  "copy_link": "Copy Share Link",
  "copy_success": "Link copied to clipboard",
  "copy_failed": "Copy failed",
  "select_categories": "Select categories to include",
  "confirm_copy": "Copy Link"
},
"context_menu": {
  "share": "Copy Share Link"
}
```

- [ ] **Step 3: Add keys to remaining 12 locales**

Add the same JSON keys to each locale file. Translations per locale:

**de-DE:**
```json
"share": {
  "copy_link": "Freigabelink kopieren",
  "copy_success": "Link in Zwischenablage kopiert",
  "copy_failed": "Kopieren fehlgeschlagen",
  "select_categories": "Kategorien zum Einschließen auswählen",
  "confirm_copy": "Link kopieren"
},
"context_menu": {
  "share": "Freigabelink kopieren"
}
```

**es-MX:**
```json
"share": {
  "copy_link": "Copiar enlace para compartir",
  "copy_success": "Enlace copiado al portapapeles",
  "copy_failed": "Error al copiar",
  "select_categories": "Seleccionar categorías a incluir",
  "confirm_copy": "Copiar enlace"
},
"context_menu": {
  "share": "Copiar enlace para compartir"
}
```

**fr-FR:**
```json
"share": {
  "copy_link": "Copier le lien de partage",
  "copy_success": "Lien copié dans le presse-papiers",
  "copy_failed": "Échec de la copie",
  "select_categories": "Sélectionner les catégories à inclure",
  "confirm_copy": "Copier le lien"
},
"context_menu": {
  "share": "Copier le lien de partage"
}
```

**id-ID:**
```json
"share": {
  "copy_link": "Salin tautan berbagi",
  "copy_success": "Tautan disalin ke papan klip",
  "copy_failed": "Gagal menyalin",
  "select_categories": "Pilih kategori untuk disertakan",
  "confirm_copy": "Salin tautan"
},
"context_menu": {
  "share": "Salin tautan berbagi"
}
```

**it-IT:**
```json
"share": {
  "copy_link": "Copia link di condivisione",
  "copy_success": "Link copiato negli appunti",
  "copy_failed": "Copia fallita",
  "select_categories": "Seleziona le categorie da includere",
  "confirm_copy": "Copia link"
},
"context_menu": {
  "share": "Copia link di condivisione"
}
```

**ja-JP:**
```json
"share": {
  "copy_link": "共有リンクをコピー",
  "copy_success": "リンクをクリップボードにコピーしました",
  "copy_failed": "コピーに失敗しました",
  "select_categories": "含めるカテゴリを選択",
  "confirm_copy": "リンクをコピー"
},
"context_menu": {
  "share": "共有リンクをコピー"
}
```

**ko-KR:**
```json
"share": {
  "copy_link": "공유 링크 복사",
  "copy_success": "링크가 클립보드에 복사되었습니다",
  "copy_failed": "복사 실패",
  "select_categories": "포함할 카테고리 선택",
  "confirm_copy": "링크 복사"
},
"context_menu": {
  "share": "공유 링크 복사"
}
```

**pt-BR:**
```json
"share": {
  "copy_link": "Copiar link de compartilhamento",
  "copy_success": "Link copiado para a área de transferência",
  "copy_failed": "Falha ao copiar",
  "select_categories": "Selecionar categorias para incluir",
  "confirm_copy": "Copiar link"
},
"context_menu": {
  "share": "Copiar link de compartilhamento"
}
```

**ru-RU:**
```json
"share": {
  "copy_link": "Копировать ссылку",
  "copy_success": "Ссылка скопирована в буфер обмена",
  "copy_failed": "Не удалось скопировать",
  "select_categories": "Выберите категории для включения",
  "confirm_copy": "Копировать ссылку"
},
"context_menu": {
  "share": "Копировать ссылку"
}
```

**th-TH:**
```json
"share": {
  "copy_link": "คัดลอกลิงก์แชร์",
  "copy_success": "คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว",
  "copy_failed": "คัดลอกล้มเหลว",
  "select_categories": "เลือกหมวดหมู่ที่จะรวม",
  "confirm_copy": "คัดลอกลิงก์"
},
"context_menu": {
  "share": "คัดลอกลิงก์แชร์"
}
```

**vi-VN:**
```json
"share": {
  "copy_link": "Sao chép liên kết chia sẻ",
  "copy_success": "Đã sao chép liên kết vào bộ nhớ tạm",
  "copy_failed": "Sao chép thất bại",
  "select_categories": "Chọn danh mục để bao gồm",
  "confirm_copy": "Sao chép liên kết"
},
"context_menu": {
  "share": "Sao chép liên kết chia sẻ"
}
```

**zh-TW:**
```json
"share": {
  "copy_link": "複製分享連結",
  "copy_success": "連結已複製到剪貼簿",
  "copy_failed": "複製失敗",
  "select_categories": "選擇要包含的分類",
  "confirm_copy": "複製連結"
},
"context_menu": {
  "share": "複製分享連結"
}
```

- [ ] **Step 4: Regenerate i18n type definitions**

Run: `pnpm lng:type`
Expected: `packages/map-service/src/@types/resources.d.ts` is updated with the new `share` and `context_menu` keys.

- [ ] **Step 5: Verify type check passes**

Run: `pnpm --filter ./packages/map-service typecheck`
Expected: PASS — no type errors.

- [ ] **Step 6: Commit**

```bash
git add packages/map-service/src/locales/*/common.json packages/map-service/src/@types/resources.d.ts
git commit -m "feat(i18n): add share link and context menu i18n keys for all 14 locales"
```

---

### Task 2: URL State Manager

**Files:**
- Create: `apps/web/src/services/url_state.ts`

- [ ] **Step 1: Create URLStateManager**

Create file `apps/web/src/services/url_state.ts`:

```typescript
export interface URLParamHandler<T = unknown> {
  key: string;
  parse: (value: string) => T;
  serialize: (value: T) => string;
}

export class URLStateManager {
  private handlers = new Map<string, URLParamHandler>();

  register(handler: URLParamHandler): void {
    this.handlers.set(handler.key, handler);
  }

  getParam<T>(key: string): T | null {
    const handler = this.handlers.get(key);
    if (!handler) return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return null;
    return handler.parse(raw) as T;
  }

  setParam(key: string, value: unknown): void {
    this.setParams({ [key]: value });
  }

  setParams(updates: Record<string, unknown>): void {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      const handler = this.handlers.get(key);
      if (!handler) continue;
      if (value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, handler.serialize(value));
      }
    }
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : '');
    history.replaceState(null, '', url);
  }

  removeParam(key: string): void {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : '');
    history.replaceState(null, '', url);
  }

  readInitialParams(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const params = new URLSearchParams(window.location.search);
    for (const [key, handler] of this.handlers) {
      const raw = params.get(key);
      if (raw !== null) {
        result[key] = handler.parse(raw);
      }
    }
    return result;
  }
}

export const urlStateManager = new URLStateManager();
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint --filter ./apps/web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/url_state.ts
git commit -m "feat(web): add URLStateManager for generic URL parameter handling"
```

---

### Task 3: Context Menu Manager

**Files:**
- Create: `apps/web/src/services/context_menu_manager.ts`

- [ ] **Step 1: Create ContextMenuManager**

Create file `apps/web/src/services/context_menu_manager.ts`:

```typescript
import type { DataInstance, MapCoordinate } from '@endfieldmap/map-core';
import { action, makeObservable, observable } from 'mobx';

export interface ContextMenuContext {
  type: 'entity' | 'connection' | 'map';
  entities?: DataInstance[];
  pixel: [number, number];
  coordinate?: MapCoordinate;
  originalEvent: MouseEvent;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType;
  order: number;
  visible?: (context: ContextMenuContext) => boolean;
  action: (context: ContextMenuContext) => void;
}

export class ContextMenuManager {
  @observable accessor isOpen = false;
  @observable accessor context: ContextMenuContext | null = null;

  private items = new Map<string, ContextMenuItem>();

  constructor() {
    makeObservable(this);
  }

  register(item: ContextMenuItem): () => void {
    this.items.set(item.id, item);
    return () => {
      this.items.delete(item.id);
    };
  }

  getVisibleItems(context: ContextMenuContext): ContextMenuItem[] {
    return Array.from(this.items.values())
      .filter((item) => !item.visible || item.visible(context))
      .sort((a, b) => a.order - b.order);
  }

  @action
  open(context: ContextMenuContext): void {
    context.originalEvent.preventDefault();
    this.context = context;
    this.isOpen = true;
  }

  @action
  close(): void {
    this.isOpen = false;
    this.context = null;
  }
}

export const contextMenuManager = new ContextMenuManager();
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint --filter ./apps/web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/context_menu_manager.ts
git commit -m "feat(web): add ContextMenuManager with MobX observable state and item registry"
```

---

### Task 4: Bridge existing context menu events to ContextMenuManager

**Files:**
- Modify: `apps/web/src/services/context_menu.ts`

- [ ] **Step 1: Update context_menu.ts to bridge events**

Replace the full content of `apps/web/src/services/context_menu.ts` with:

```typescript
import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

import { service } from '@/services';
import { contextMenuManager } from '@/services/context_menu_manager';

export function initContextMenuEventListeners(adapter: EndfieldMapAdapter): () => void {
  const disposeConnection = adapter.event.on(MAP_EVENT.CONNECTION_CONTEXT_MENU, (event) => {
    logger.debug('connection_context_menu', event);
    contextMenuManager.open({
      type: 'connection',
      pixel: event.event.pixel,
      coordinate: event.event.coordinate,
      originalEvent: event.event.originalEvent,
    });
  });

  const disposeEntity = adapter.event.on(MAP_EVENT.ENTITY_CONTEXT_MENU, (event) => {
    logger.debug('entity_context_menu', event);
    contextMenuManager.open({
      type: 'entity',
      entities: event.entities.map((e) => e.instance).filter(Boolean),
      pixel: event.event.pixel,
      coordinate: event.event.coordinate,
      originalEvent: event.event.originalEvent,
    });
  });

  const disposeMap = adapter.event.on(MAP_EVENT.MAP_CONTEXT_MENU, (event) => {
    logger.debug('map_context_menu', event);
    contextMenuManager.open({
      type: 'map',
      pixel: event.pixel,
      coordinate: event.coordinate,
      originalEvent: event.originalEvent,
    });
  });

  const disposeEntityMiddleClick = adapter.event.on(MAP_EVENT.ENTITY_MIDDLE_CLICK, (event) => {
    logger.debug('entity_middle_click', event);
    for (const entity of event.entities) {
      if (!entity.instance?.markable) continue;
      service.dataService.mapDataService.entityDataService.markEntity(
        entity.instance.mapId,
        entity.instance.id,
        !entity.instance.marked
      );
    }
  });

  return () => {
    disposeConnection();
    disposeEntity();
    disposeMap();
    disposeEntityMiddleClick();
  };
}
```

Note: The `MAP_CONTEXT_MENU` event payload is `MapContextMenuEventDetail` directly (not wrapped in `{ event: ... }` like the others), so the field access is `event.pixel` not `event.event.pixel`.

- [ ] **Step 2: Verify lint and typecheck**

Run: `pnpm lint --filter ./apps/web && pnpm typecheck --filter ./apps/web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/context_menu.ts
git commit -m "feat(web): bridge MAP_EVENT context menu events to ContextMenuManager"
```

---

### Task 5: Share Link Service — parse and generate

**Files:**
- Create: `apps/web/src/services/share_link.ts`

- [ ] **Step 1: Create share_link.ts**

Create file `apps/web/src/services/share_link.ts`:

```typescript
import { logger } from '@endfieldmap/tools';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { contextMenuManager } from '@/services/context_menu_manager';
import { urlStateManager } from '@/services/url_state';

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

  if (!mapId) return;

  const adapter = service.adapterRegistry?.adapter;
  if (!adapter) return;

  const validMapIds = adapter.mapController.dataManager.mapIds;
  if (!validMapIds.includes(mapId)) {
    logger.warn('[ShareLink] Invalid map ID:', mapId);
    return;
  }

  service.dataService.mapDataService.mapStateDataService.setCurrentMap(mapId);

  if (selectKeys && selectKeys.length > 0) {
    const targetMapId = mapId;
    for (const key of selectKeys) {
      service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(targetMapId, key, true);
    }
  }

  if (entityId !== undefined && !isNaN(entityId)) {
    const found = await service.dataService.mapDataService.moveToEntity(entityId, true, true);
    if (!found) {
      logger.warn('[ShareLink] Entity not found:', entityId);
    }
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
    alert.info(t('share.copy_success'));
  } catch {
    alert.info(t('share.copy_failed'));
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

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint --filter ./apps/web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/share_link.ts
git commit -m "feat(web): add ShareLinkService for URL parsing, link generation, and context menu registration"
```

---

### Task 6: Wire share link init into MapService

**Files:**
- Modify: `apps/web/src/services/map.ts`

- [ ] **Step 1: Add share link initialization to MapService._init()**

In `apps/web/src/services/map.ts`, add an import at the top (after the existing imports):

```typescript
import { applyShareLinkParams, initShareLink } from '@/services/share_link';
```

Then, inside `_init()`, after the line `this.eventDisposers.push(initHoverFeatureEventListeners(this.adapter!));` (around line 135), add:

```typescript
      initShareLink();
      await applyShareLinkParams();
```

This goes just before the `return { adapter: this.adapter };` statement.

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck --filter ./apps/web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/map.ts
git commit -m "feat(web): wire share link init and URL param application into MapService"
```

---

### Task 7: Context Menu UI Component (PC)

**Files:**
- Create: `apps/web/src/components/themes/endfield/ui/context_menu/index.tsx`

- [ ] **Step 1: Create the ContextMenu React component**

Create file `apps/web/src/components/themes/endfield/ui/context_menu/index.tsx`:

```tsx
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, shortcutService } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { contextMenuManager } from '@/services/context_menu_manager';

const MENU_PADDING = 8;

const ContextMenu: React.FC = observer(() => {
  const { t } = useTranslation('common');
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { isOpen, context } = contextMenuManager;

  const items = context ? contextMenuManager.getVisibleItems(context) : [];

  useEffect(() => {
    if (!isOpen || !context) return;

    const { pixel } = context;
    let x = pixel[0];
    let y = pixel[1];

    requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - MENU_PADDING) {
        x = window.innerWidth - rect.width - MENU_PADDING;
      }
      if (y + rect.height > window.innerHeight - MENU_PADDING) {
        y = window.innerHeight - rect.height - MENU_PADDING;
      }
      setPosition({ x: Math.max(MENU_PADDING, x), y: Math.max(MENU_PADDING, y) });
    });

    setPosition({ x, y });
  }, [isOpen, context]);

  const handleClose = useCallback(() => {
    contextMenuManager.close();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dispose = shortcutService.register('Escape', (e: KeyboardEvent) => {
      e.preventDefault();
      handleClose();
      return true;
    });
    return () => dispose();
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleScroll = () => handleClose();

    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, handleClose]);

  if (items.length === 0 && isOpen) {
    contextMenuManager.close();
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && context && items.length > 0 && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
          style={{ left: position.x, top: position.y }}
          className={cn(
            'fixed z-[9999] min-w-44 py-1',
            'bg-[#1e1e1e]/95 backdrop-blur-sm',
            'border border-[#4a4a2a] shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
          )}
        >
          {items.map((item) => (
            <ButtonWithAudio
              key={item.id}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90',
                'hover:bg-[#fcee21]/10 hover:text-[#fcee21] transition-colors',
              )}
              onClick={() => {
                item.action(context);
                handleClose();
              }}
            >
              {item.icon && <item.icon />}
              <span>{t(item.label)}</span>
            </ButtonWithAudio>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default ContextMenu;
```

- [ ] **Step 2: Mount ContextMenu in the app**

The ContextMenu must be rendered inside the `Controllers` component in `apps/web/src/Map.tsx`, alongside the existing themed components. Add a lazy import at the top of the file:

```typescript
const ContextMenu = lazy(() => import('@/components/themes/endfield/ui/context_menu'));
```

Then inside the `Controllers` component's JSX, add a `<Suspense>` block right after the Popup block (around line 49):

```tsx
{/* 弹窗组件 */}
<Suspense>
  <ThemedComponents.map.Popup />
</Suspense>

{/* 右键菜单 */}
<Suspense>
  <ContextMenu />
</Suspense>
```

- [ ] **Step 3: Verify lint and typecheck**

Run: `pnpm lint --filter ./apps/web && pnpm typecheck --filter ./apps/web`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/themes/endfield/ui/context_menu/index.tsx apps/web/src/Map.tsx
git commit -m "feat(web): add PC context menu component with portal rendering and motion animation"
```

---

### Task 8: Popup Share Button with Category Popover

**Files:**
- Create: `apps/web/src/components/themes/endfield/ui/popup/left_content/buttons/share.tsx`
- Modify: `apps/web/src/components/themes/endfield/ui/popup/left.tsx`

- [ ] **Step 1: Create ShareButton component**

Create file `apps/web/src/components/themes/endfield/ui/popup/left_content/buttons/share.tsx`:

```tsx
import type { DataInstance } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, ShareIcon, Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { buildShareLink, copyShareLink } from '@/services/share_link';
import { getEntityIcon } from '@/utils/entity';

interface CategoryItem {
  entityDataIdKey: string;
  category: string;
  name: string;
  pic: string;
  visible: boolean;
}

const CategoryCheckbox: React.FC<{
  item: CategoryItem;
  checked: boolean;
  onChange: (key: string, checked: boolean) => void;
}> = ({ item, checked, onChange }) => {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer',
        'hover:bg-white/5 transition-colors',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(item.entityDataIdKey, e.target.checked)}
        className="accent-[#fcee21] w-3.5 h-3.5 shrink-0"
      />
      {item.pic && (
        <img
          src={getEntityIcon(item.category, item.pic)}
          className="w-4 h-4 shrink-0"
          alt=""
        />
      )}
      <span className="text-xs text-white/80 truncate">{item.name}</span>
    </label>
  );
};

export interface ShareButtonProps {
  entity: DataInstance;
}

export const ShareButton: React.FC<ShareButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation('common');
  const { adapter } = useAdapter();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const categories: CategoryItem[] = adapter.entityController.currentStats
    .filter((s) => s.mapId === entity.mapId)
    .map((s) => ({
      entityDataIdKey: s.entityDataIdKey,
      category: s.category,
      name: t(`lang:${s.entityDataIdKey}`, { defaultValue: s.entityDataIdKey }),
      pic: s.entityInfo?.pic || '',
      visible: s.visible,
    }));

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showPopover) {
      setCheckedKeys(new Set(categories.filter((c) => c.visible).map((c) => c.entityDataIdKey)));
    }
  }, [showPopover]);

  const handleToggle = useCallback((key: string, checked: boolean) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    const link = buildShareLink(entity.mapId, entity.id, Array.from(checkedKeys));
    await copyShareLink(link, t);
    setShowPopover(false);
  }, [entity.mapId, entity.id, checkedKeys, t]);

  useEffect(() => {
    if (!showPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside, true);
    return () => window.removeEventListener('mousedown', handleClickOutside, true);
  }, [showPopover]);

  return (
    <div className="relative" ref={buttonRef}>
      <Tooltip
        tooltip={t('share.copy_link')}
        as={ButtonWithAudio}
        placement="bottom"
        asProps={{
          className: cn('text-xl p-1', showPopover && 'text-[#fcee21]'),
          onClick: () => setShowPopover((v) => !v),
        }}
      >
        <ShareIcon />
      </Tooltip>

      <AnimatePresence>
        {showPopover && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
              'w-56 bg-[#1e1e1e]/95 backdrop-blur-sm',
              'border border-[#4a4a2a] shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
            )}
          >
            <div className="px-2 py-1.5 text-xs text-white/50 border-b border-[#383938]">
              {t('share.select_categories')}
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {categories.map((cat) => (
                <CategoryCheckbox
                  key={cat.entityDataIdKey}
                  item={cat}
                  checked={checkedKeys.has(cat.entityDataIdKey)}
                  onChange={handleToggle}
                />
              ))}
            </div>
            <div className="border-t border-[#383938] p-2">
              <ButtonWithAudio
                className={cn(
                  'w-full py-1.5 text-xs text-center',
                  'bg-[#fcee21]/10 text-[#fcee21] hover:bg-[#fcee21]/20 transition-colors',
                )}
                onClick={handleCopy}
              >
                {t('share.confirm_copy')}
              </ButtonWithAudio>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
```

- [ ] **Step 2: Add ShareButton to popup header**

In `apps/web/src/components/themes/endfield/ui/popup/left.tsx`, add the import:

```typescript
import { ShareButton } from '@/components/themes/endfield/ui/popup/left_content/buttons/share';
```

Then in the `LeftContent` component, add `<ShareButton entity={activeFeature} />` in the `<PopupHeader>` children, after `<MarkButton>` and before `<RenameButton>`:

Change the header section (around line 95-99) from:

```tsx
<PopupHeader onClose={() => adapter.activeFeatureController.clearActiveFeature?.()} start={unRefreshable && <UnrefreshableTip />}>
  <PlayVideoButton videoLink={videoLink} />
  <MarkButton entity={activeFeature} />
  <RenameButton entity={activeFeature} />
  <DeleteButton entity={activeFeature} />
</PopupHeader>
```

to:

```tsx
<PopupHeader onClose={() => adapter.activeFeatureController.clearActiveFeature?.()} start={unRefreshable && <UnrefreshableTip />}>
  <PlayVideoButton videoLink={videoLink} />
  <MarkButton entity={activeFeature} />
  <ShareButton entity={activeFeature} />
  <RenameButton entity={activeFeature} />
  <DeleteButton entity={activeFeature} />
</PopupHeader>
```

- [ ] **Step 3: Verify lint and typecheck**

Run: `pnpm lint --filter ./apps/web && pnpm typecheck --filter ./apps/web`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/themes/endfield/ui/popup/left_content/buttons/share.tsx apps/web/src/components/themes/endfield/ui/popup/left.tsx
git commit -m "feat(web): add ShareButton with category selection popover in popup header"
```

---

### Task 9: Manual verification in dev server

**Files:** None (testing only)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev:web`

- [ ] **Step 2: Test share link consumption**

Open the app with URL params: `http://localhost:5173/?map=map01&id=<some-valid-id>&select=enemy,mineral`
Expected: The app should switch to `map01`, enable the `enemy` and `mineral` categories, and pan to the entity with popup open.

- [ ] **Step 3: Test share link generation from popup**

Click any entity on the map to open its popup. Click the share (ShareIcon) button. A popover should appear with:
- Category checkboxes (currently visible ones checked)
- "Copy Link" button at the bottom
Click "Copy Link" — paste the result and verify the URL contains `?map=...&id=...&select=...`.

- [ ] **Step 4: Test context menu share**

Right-click on a map entity. A context menu should appear with "复制分享链接" / "Copy Share Link". Click it and verify the link is copied to clipboard.

- [ ] **Step 5: Test edge cases**

- Open with invalid `id`: `?map=map01&id=999999` — should switch to map01 but no popup.
- Open with only `select`: `?map=map01&select=enemy` — should switch map and enable enemy category.
- Open with only `map`: `?map=map01` — should only switch map.
- Right-click on empty map area — no context menu should appear (no registered items for `type: 'map'`).
- Context menu closes on Escape, click outside, scroll.
- Popover closes on click outside.

- [ ] **Step 6: Run full project checks**

Run: `pnpm typecheck && pnpm lint`
Expected: All pass.
