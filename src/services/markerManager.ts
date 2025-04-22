import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { getFeatures } from './render';
import { entityInfo as entityInfoData } from '@/data/entity';
import { map } from './MapCore';
import { xyz2crd } from '@/utils/common';

export class MarkerManager {
  /**
   * 获取指定类型的标记
   * @param category 标记类型
   * @returns 匹配的标记数组
   */
  static getMarkersByCategory(category: string): Feature<Point>[] {
    return getFeatures().filter(feature => {
      const data = feature.get('payload');
      const entityInfo = entityInfoData[data?.entityDataIdKey];
      return entityInfo?.category === category;
    });
  }

  /**
   * 获取标记的位置
   * @param feature 标记
   * @returns 转换后的坐标
   */
  static getMarkerPosition(feature: Feature<Point>): [number, number] | null {
    const data = feature.get('payload');
    if (!data?.position) return null;
    const position = xyz2crd(data.position);
    return [position[0], position[1]] as [number, number];
  }

  /**
   * 将地图视图移动到指定标记位置
   * @param position 目标位置
   * @param zoom 缩放级别
   */
  static moveToMarker(position: [number, number], zoom: number = 4): void {
    const view = map.value?.getView();
    if (view) {
      view.animate({
        center: position,
        duration: 300,
        zoom: zoom,
      });
    }
  }
}
