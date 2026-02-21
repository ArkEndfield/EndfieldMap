import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

import { service } from '@/services';

/**
 * 初始化右键菜单事件监听器
 * @param adapter 地图适配器
 */
export function initContextMenuEventListeners(adapter: EndfieldMapAdapter) {
  adapter.event.on(MAP_EVENT.CONNECTION_CONTEXT_MENU, (event) => {
    logger.debug('connection_context_menu', event);
  });

  adapter.event.on(MAP_EVENT.ENTITY_CONTEXT_MENU, (event) => {
    logger.debug('map_context_menu', event);
    // 右键标记
    if (!event.instance) return;
    if (!event.instance?.markable) return null;
    service.dataService.mapDataService.entityDataService.markEntity(event.instance.mapId, event.instance.id, !event.instance.marked);
  });
}
