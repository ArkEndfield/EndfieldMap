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

  const adapter = service.adapterRegistry?.adapter;
  if (!adapter) return;

  const validMapIds = adapter.mapController.dataManager.mapIds;

  if (mapId) {
    if (!validMapIds.includes(mapId)) {
      logger.warn('[ShareLink] Invalid map ID:', mapId);
      return;
    }
    service.dataService.mapDataService.mapStateDataService.setCurrentMap(mapId);
  }

  if (selectKeys && selectKeys.length > 0) {
    const targetMapId = mapId ?? service.dataService.mapDataService.mapStateDataService.currentMap.value;
    for (const key of selectKeys) {
      service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(targetMapId, key, true);
    }
  }

  if (mapId && entityId !== undefined && !isNaN(entityId)) {
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
