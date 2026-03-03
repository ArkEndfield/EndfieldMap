import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

import { service } from '@/services';

/**
 * 初始化右键菜单与中键标记事件监听器
 * @param adapter 地图适配器
 */
export function initContextMenuEventListeners(adapter: EndfieldMapAdapter): () => void {
  // TODO: 右键事件仍然监听，后续可用于其他功能（如右键菜单）
  const disposeConnection = adapter.event.on(MAP_EVENT.CONNECTION_CONTEXT_MENU, (event) => {
    logger.debug('connection_context_menu', event);
  });

  // TODO: 右键事件仍然监听，后续可用于其他功能（如右键菜单）
  const disposeEntity = adapter.event.on(MAP_EVENT.ENTITY_CONTEXT_MENU, (event) => {
    logger.debug('entity_context_menu', event);
  });

  // 中键一键标记
  const disposeEntityMiddleClick = adapter.event.on(MAP_EVENT.ENTITY_MIDDLE_CLICK, (event) => {
    logger.debug('entity_middle_click', event);
    if (!event.instance) return;
    if (!event.instance?.markable) return null;
    service.dataService.mapDataService.entityDataService.markEntity(
      event.instance.mapId,
      event.instance.id,
      !event.instance.marked
    );
  });

  return () => {
    disposeConnection();
    disposeEntity();
    disposeEntityMiddleClick();
  };
}
