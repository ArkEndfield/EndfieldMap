import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';

/**
 * 瓦片投影范围（像素空间）
 * OL SIMPLE 投影的 extent 为 [0, 0, 256, 256]
 */
const TILE_EXTENT = 256;

/**
 * 将 OL SIMPLE 投影的像素坐标转换为 MapLibre 的经纬度坐标
 *
 * OL SIMPLE 投影坐标系：
 *  - x: [0, 256]，向右增大
 *  - y: [0, 256]，向上增大（0 = 底部，256 = 顶部）
 *
 * MapLibre Web Mercator：
 *  - lng: [-180, 180]
 *  - lat: [-85.05, 85.05]
 *
 * 映射关系基于标准 XYZ 瓦片方案中 zoom=0 的单一瓦片覆盖整个世界
 */
export function pixelToLngLat(coordinate: MapCoordinate): [number, number] {
  const [px, py] = coordinate;

  const lng = (px / TILE_EXTENT) * 360 - 180;

  const tileYFraction = (TILE_EXTENT - py) / TILE_EXTENT;
  const n = Math.PI * (1 - 2 * tileYFraction);
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return [lng, lat];
}

/**
 * 将 MapLibre 经纬度坐标转换回 OL SIMPLE 投影的像素坐标
 */
export function lngLatToPixel(lng: number, lat: number): MapCoordinate {
  const px = ((lng + 180) / 360) * TILE_EXTENT;

  const latRad = (lat * Math.PI) / 180;
  const tileYFraction = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  const py = TILE_EXTENT - tileYFraction * TILE_EXTENT;

  return [px, py];
}

/**
 * 将 MapLibre 的 zoom 级别映射为 OL SIMPLE 投影的 zoom 级别
 * 由于两者使用相同的 XYZ 瓦片方案，zoom 级别是 1:1 映射
 */
export function mapLibreZoomToPixelZoom(zoom: number): number {
  return zoom;
}

/**
 * 构建瓦片 URL 模板
 * OL 瓦片路径格式：{mapImage}/{mapId}/{z}/{y}/{x}.png
 * MapLibre 也支持同样的 URL 模板占位符
 */
export function buildTileUrlTemplate(mapImageBase: string, mapId: string): string {
  return `${mapImageBase}/${mapId}/{z}/{y}/{x}.png`;
}
