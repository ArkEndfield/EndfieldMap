import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { ELECTRIC_ZONE_RADIUS, LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { ElectricPoleZoneSource } from '@endfieldmap/map-core/render/source/electric_pole_zone';
import type { ElectricPoleData, ElectricPoleDataList } from '@endfieldmap/map-core/types';
import VectorLayer from 'ol/layer/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

export interface ElectricPoleZoneLayerConfig {
  /** 电线杆数据列表 */
  data: ElectricPoleDataList;
  /** 地图索引 */
  mapIndex: MapIndex;
  /** 渲染缓冲区 */
  renderBuffer?: number;
}

/**
 * 电线杆覆盖区域图层
 * 使用 Circle 几何（地图坐标半径），尺寸随地图缩放保持一致
 */
export class ElectricPoleZoneLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer;
  /** 数据源 */
  public source: ElectricPoleZoneSource;
  /** 当前地图索引 */
  public currentMapIndex: MapIndex;

  constructor(config: ElectricPoleZoneLayerConfig) {
    super();
    this.currentMapIndex = config.mapIndex;
    this.source = new ElectricPoleZoneSource({
      data: config.data,
      mapIndex: config.mapIndex,
      radius: ELECTRIC_ZONE_RADIUS[config.mapIndex],
    });

    this.layer = new VectorLayer({
      source: this.source.source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(0, 123, 255, 0.15)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 123, 255, 0.6)',
          width: 2,
        }),
      }),
      renderBuffer: config.renderBuffer ?? 250,
      zIndex: 3, // 电线杆范围图层
      visible: true,
    });

    this.layer.set(LayerTypeKey, LayerType.ELECTRIC_POLE);
  }

  /**
   * 设置图层可见性
   */
  public setVisible(visible: boolean) {
    this.layer.setVisible(visible);
  }

  /**
   * 获取图层可见性
   */
  public getVisible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 为电线杆添加覆盖区域
   */
  public addZone(data: ElectricPoleData) {
    return this.source.addZone(data);
  }

  /**
   * 删除指定电线杆的覆盖区域
   */
  public removeZoneById(id: number) {
    this.source.removeZoneById(id);
  }
}
