import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import type { MapCoordinate } from '@endfieldmap/map-core';
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
      coordinate: event.event.coordinate as MapCoordinate | undefined,
      originalEvent: event.event.originalEvent,
    });
  });

  const disposeEntity = adapter.event.on(MAP_EVENT.ENTITY_CONTEXT_MENU, (event) => {
    logger.debug('entity_context_menu', event);
    contextMenuManager.open({
      type: 'entity',
      entities: event.entities.map((e) => e.instance).filter(Boolean),
      pixel: event.event.pixel,
      coordinate: event.event.coordinate as MapCoordinate | undefined,
      originalEvent: event.event.originalEvent,
    });
  });

  const disposeMap = adapter.event.on(MAP_EVENT.MAP_CONTEXT_MENU, (event) => {
    logger.debug('map_context_menu', event);
    contextMenuManager.open({
      type: 'map',
      pixel: event.pixel,
      coordinate: event.coordinate as MapCoordinate | undefined,
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
