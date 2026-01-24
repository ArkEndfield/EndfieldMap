import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import { ElectricPoleMapDataManager } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_map_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { ElectricPoleRenderer } from '@endfieldmap/map-core/render/renderer/electric_pole/electric_pole_renderer';
import { ElectricPoleZoneRenderer } from '@endfieldmap/map-core/render/renderer/electric_pole/electric_pole_zone_renderer';
import type { MapData } from '@endfieldmap/map-core/types';
import VectorLayer from 'ol/layer/Vector';

export class ElectricPoleRender {
  public renderInstances: Map<MapData['id'], ElectricPoleRenderer> = new Map();
  public zoneRenderInstances: Map<MapData['id'], ElectricPoleZoneRenderer> = new Map();
  private renders: VectorLayer[] = [];

  constructor(dataManager: ElectricPoleMapDataManager) {
    const mapDataManager = MapDataManager.getInstance();
    const assetPath = EndfieldMapAsset.getInstance();
    mapDataManager.data.forEach((item) => {
      this.renderInstances.set(
        item.id,
        new ElectricPoleRenderer({
          dataManager: dataManager.getMapManager(item.id),
          imagePath: assetPath.entityImage,
        })
      );
      this.zoneRenderInstances.set(
        item.id,
        new ElectricPoleZoneRenderer({
          dataManager: dataManager.getMapManager(item.id),
        })
      );
    });
  }

  /** 渲染地图 */
  public render(mapId: MapData['id']) {
    const electricPoleInstance = this.getElectricPoleInstance(mapId);
    if (electricPoleInstance) {
      this.clearLayer();
      const mapInstance = EndfieldMap.getInstance();
      mapInstance.map.addLayer(electricPoleInstance.pole.entityLayer);
      mapInstance.map.addLayer(electricPoleInstance.pole.connectionLayer);
      mapInstance.map.addLayer(electricPoleInstance.zone.layer);
      this.renders.push(
        electricPoleInstance.pole.entityLayer,
        electricPoleInstance.pole.connectionLayer,
        electricPoleInstance.zone.layer
      );
    }
  }

  public getElectricPolePoleInstance(mapId: MapData['id']) {
    const instance = this.renderInstances.get(mapId);
    if (!instance) {
      throw new Error(`ElectricPoleRender: current map ${mapId} not found`);
    }
    return instance;
  }

  public getElectricPoleZoneInstance(mapId: MapData['id']) {
    const instance = this.zoneRenderInstances.get(mapId);
    if (!instance) {
      throw new Error(`ElectricPoleRender: current map ${mapId} not found`);
    }
    return instance;
  }

  public getElectricPoleInstance(mapId: MapData['id']) {
    const renderInstance = this.getElectricPolePoleInstance(mapId);
    const zoneRenderInstance = this.getElectricPoleZoneInstance(mapId);
    return {
      pole: renderInstance,
      zone: zoneRenderInstance,
    };
  }

  /** 获取当前地图 */
  public get currentElectricPoleInstance() {
    const mapDataManager = MapDataManager.getInstance();
    return this.getElectricPoleInstance(mapDataManager.currentMapId);
  }

  /**
   * 设置可见性
   * @param visible 可见性
   */
  public setVisible(visible: boolean) {
    this.renderInstances.forEach((instance) => {
      instance.setVisible(visible);
    });
    this.zoneRenderInstances.forEach((instance) => {
      instance.setVisible(visible);
    });
  }

  public setZoneVisible(visible: boolean) {
    this.zoneRenderInstances.forEach((instance) => {
      instance.setVisible(visible);
    });
  }

  /** 清除图层 */
  public clearLayer() {
    const mapInstance = EndfieldMap.getInstance();
    this.renders.forEach((render) => {
      mapInstance.map.removeLayer(render);
    });
    this.renders = [];
  }

  /** 释放资源 */
  public dispose() {
    this.clearLayer();
    this.renderInstances.forEach((instance) => {
      instance.dispose();
    });
    this.zoneRenderInstances.forEach((instance) => {
      instance.dispose();
    });
  }
}
