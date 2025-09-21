import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { MAP_VIEW_STATE_KEY_PREFIX } from '@/services/map/constants';
import { map } from '@/services/map/state';
import { MapViewState } from '@/types/map';

/**
 * 保存地图视图状态到IndexedDB
 * @param mapId 地图ID
 */
export async function saveMapViewState(mapId: string): Promise<void> {
  if (!map.value) return;

  const view = map.value.getView();
  const center = view.getCenter();
  const zoom = view.getZoom(); // 直接获取 zoom

  if (!center || zoom === undefined) return;

  // 确保中心点坐标是简单数组，不是 OpenLayers 内部对象
  const viewState: MapViewState = {
    center: [center[0], center[1]], // 创建新数组，确保是简单的数字数组
    zoom: zoom,
    timestamp: Date.now(),
  };

  try {
    const key = `${MAP_VIEW_STATE_KEY_PREFIX}${mapId}`;
    await setItem(key, viewState, StorageType.PERMANENT, null);
    // 只在开发环境记录详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`已保存地图 ${mapId} 的视图状态`);
    }
  } catch (error) {
    console.error(`保存地图 ${mapId} 视图状态失败:`, error);
  }
}

/**
 * 从IndexedDB恢复地图视图状态
 * @param mapId 地图ID
 */
export async function restoreMapViewState(
  mapId: string
): Promise<MapViewState | null> {
  try {
    const key = `${MAP_VIEW_STATE_KEY_PREFIX}${mapId}`;
    const viewState = await getItem<MapViewState>(key, StorageType.PERMANENT);

    // 只在开发环境记录详细日志
    if (process.env.NODE_ENV === 'development' && viewState) {
      console.log(`已恢复地图 ${mapId} 的视图状态`);
    }

    return viewState || null;
  } catch (error) {
    console.error(`恢复地图 ${mapId} 视图状态失败:`, error);
    return null;
  }
}
