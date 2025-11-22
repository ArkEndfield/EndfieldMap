import VectorLayer from 'ol/layer/Vector';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { ConnectionFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { MapIndex } from '@endfieldmap/map-core/const/map';
import { ElectricPoleConnectionSource } from '@endfieldmap/map-core/render/source/electric_pole_connection';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';

export interface ElectricPoleConnectionLayerConfig {
  mapIndex: MapIndex;
}

export class ElectricPoleConnectionLayer extends SingleLayerBase {
  public layer: VectorLayer;
  public source: ElectricPoleConnectionSource;
  public mapIndex: MapIndex;

  constructor(config: ElectricPoleConnectionLayerConfig) {
    super();
    this.mapIndex = config.mapIndex;
    this.source = new ElectricPoleConnectionSource({
      mapIndex: config.mapIndex,
    });
    this.layer = new VectorLayer({
      source: this.source.source,
      style: new Style({
        stroke: new Stroke({
          color: '#FFD700',
          width: 3,
        }),
      }),
      zIndex: 4, // 电线杆连线图层
    });
  }

  /**
   * 添加连接feature
   * @param feature 连接feature
   */
  public addFeature(feature: ConnectionFeature) {
    this.source.addFeature(feature);
  }

  /**
   * 移除连接feature
   * @param feature 连接feature
   */
  public removeFeature(feature: ConnectionFeature) {
    this.source.removeFeature(feature);
  }

  /**
   * 清空连接feature
   * @param mapIndex 地图索引
   */
  public clearFeatures() {
    this.source.clearFeatures();
  }
}
