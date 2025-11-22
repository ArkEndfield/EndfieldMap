import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { ElectricPoleZoneSource } from '@endfieldmap/map-core/render/source/electric_pole_zone';
import type { ElectricPoleData, ElectricPoleDataList } from '@endfieldmap/map-core/types';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';

export interface ElectricPoleZoneLayerConfig {
  /** 电线杆数据列表 */
  data: ElectricPoleDataList;
  /** 地图索引 */
  mapIndex: MapIndex;
  /** 区域半径（地图坐标单位） */
  radius: number;
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

  constructor(config: ElectricPoleZoneLayerConfig) {
    super();
    this.source = new ElectricPoleZoneSource({
      data: config.data,
      mapIndex: config.mapIndex,
      radius: config.radius,
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
    });

    this.layer.set(LayerTypeKey, LayerType.ELECTRIC_POLE);
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
