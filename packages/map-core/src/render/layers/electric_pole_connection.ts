import { MapIndex } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { ElectricPoleConnectionSource } from '@endfieldmap/map-core/render/source/electric_pole_connection';
import { ConnectionFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { action,observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

export interface ElectricPoleConnectionLayerConfig {
  mapIndex: MapIndex;
}

export class ElectricPoleConnectionLayer extends SingleLayerBase {
  public layer: VectorLayer;
  public source: ElectricPoleConnectionSource;
  public mapIndex: MapIndex;
  @observable accessor hoveredFeature: FeatureLike | null = null;

  constructor(config: ElectricPoleConnectionLayerConfig) {
    super();
    this.mapIndex = config.mapIndex;
    this.source = new ElectricPoleConnectionSource({
      mapIndex: config.mapIndex,
    });
    this.layer = new VectorLayer({
      source: this.source.source,
      style: (feature) => this.getConnectionStyle(feature),
      zIndex: 4, // 电线杆连线图层
    });
  }

  /**
   * 获取连接线样式
   * @param feature 连接feature
   * @returns 样式
   */
  private getConnectionStyle(feature: FeatureLike): Style {
    const isHovered = this.hoveredFeature === feature;
    return new Style({
      stroke: new Stroke({
        color: isHovered ? '#FFA500' : '#FFD700', // hover时使用橙色，否则使用金色
        width: isHovered ? 4 : 3, // hover时加粗
      }),
    });
  }

  /**
   * 设置hover的feature
   * @param feature hover的feature
   */
  @action
  public setHoveredFeature(feature: FeatureLike | null) {
    if (this.hoveredFeature === feature) {
      return;
    }
    this.hoveredFeature = feature;
    // 触发图层重新渲染
    this.layer.changed();
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

  /**
   * 设置图层可见性
   */
  public setVisible(visible: boolean) {
    this.layer.setVisible(visible);
  }
}
