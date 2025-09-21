import { cacheMapId, map } from '@/services/map/state';

export function getZoom(): number {
  const currentMap = map.value;
  if (!currentMap) return 0;
  const zoom = currentMap.getView().getZoom();
  return zoom || 0;
}

export function getCurrentMapId(): string {
  return cacheMapId.value;
}
