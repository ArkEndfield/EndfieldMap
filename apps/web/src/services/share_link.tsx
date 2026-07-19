import { logger } from '@endfieldmap/tools';
import { ShareIcon } from '@endfieldmap/web-components';
import {
  ShareSelectAlertContent,
  type ShareSelectAlertItem,
} from '@themes/endfield/ui/share_select/alert_content';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { contextMenuManager } from '@/services/context_menu_manager';
import { buildMapsByKey, resolveSelectPlacement } from '@/services/share_link_resolve';
import { shareSelectStore } from '@/services/share_select_store';
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

  // 3. id (priority over select; may switch map). Detect cross-map to prompt.
  let idAnchored = false;
  let idAlertShown = false;
  if (entityId !== undefined && !isNaN(entityId)) {
    const instance = adapter.entityRegistry.searchById(validMapIds, entityId);
    if (!instance) {
      logger.warn('[ShareLink] Entity not found:', entityId);
    } else {
      const entityMapId = instance.mapId;
      const idCrossMap = entityMapId !== targetMapId;
      await service.dataService.mapDataService.moveToEntityInstance(instance, true, true);
      idAnchored = true;
      targetMapId = mapState.currentMap.value;
      if (selectKeys && selectKeys.length > 0) applyVisibleOn(targetMapId, selectKeys);
      if (idCrossMap) {
        idAlertShown = true;
        alert.info(translate('share_link.id_not_on_map_switched', { map: mapDisplayName(entityMapId) }));
      }
    }
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
      } else if (!idAlertShown) {
        // none + offMap (id-anchored): only inform if the id step didn't already alert.
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
    icon: ShareIcon,
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
