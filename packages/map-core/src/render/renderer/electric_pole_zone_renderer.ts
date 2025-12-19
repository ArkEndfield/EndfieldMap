import { ELECTRIC_ZONE_RADIUS, type MapIndex } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleDataInstance, ElectricPoleDataManager } from '@endfieldmap/map-core/data/electric_pole';
import { type IReactionDisposer,reaction } from 'mobx';
import { Feature } from 'ol';
import { Circle as CircleGeom } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/**
 * 电线杆覆盖区域渲染器配置
 */
export interface ElectricPoleZoneRendererConfig {
  /** 数据管理器 */
  dataManager: ElectricPoleDataManager;
  /** 填充颜色 */
  fillColor?: string;
  /** 描边颜色 */
  strokeColor?: string;
}

/**
 * Zone Feature映射
 */
interface ZoneFeatureMapping {
  feature: Feature;
  dataInstance: ElectricPoleDataInstance;
  disposer: IReactionDisposer;
}

/**
 * 电线杆覆盖区域渲染器
 * 负责渲染电线杆的覆盖范围
 */
export class ElectricPoleZoneRenderer {
  /** 地图索引 */
  public readonly mapIndex: MapIndex;

  /** 数据管理器 */
  public readonly dataManager: ElectricPoleDataManager;

  /** 图层实例 */
  public readonly layer: VectorLayer;

  /** 数据源 */
  private readonly source: VectorSource;

  /** Feature映射 */
  private featureMappings: Map<number, ZoneFeatureMapping> = new Map();

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  /** 区域样式 */
  private readonly zoneStyle: Style;

  constructor(config: ElectricPoleZoneRendererConfig) {
    this.dataManager = config.dataManager;
    this.mapIndex = config.dataManager.mapIndex;

    // 创建样式
    this.zoneStyle = new Style({
      fill: new Fill({
        color: config.fillColor ?? 'rgba(255, 215, 0, 0.15)',
      }),
      stroke: new Stroke({
        color: config.strokeColor ?? 'rgba(255, 215, 0, 0.5)',
        width: 1,
      }),
    });

    // 初始化数据源
    this.source = new VectorSource();

    // 初始化图层
    this.layer = new VectorLayer({
      source: this.source,
      style: this.zoneStyle,
      visible: true,
      zIndex: 3,
    });

    // 初始化features
    this.initializeFeatures();

    // 设置数据变化监听
    this.setupDataManagerReaction();
  }

  /**
   * 获取区域半径
   */
  private getZoneRadius(): number {
    return ELECTRIC_ZONE_RADIUS[this.mapIndex] ?? 10;
  }

  /**
   * 初始化所有features
   */
  private initializeFeatures(): void {
    for (const instance of this.dataManager.instances) {
      this.addFeatureForInstance(instance);
    }
  }

  /**
   * 为数据实例添加zone feature
   */
  private addFeatureForInstance(dataInstance: ElectricPoleDataInstance): void {
    const feature = new Feature();
    const coordinates = dataInstance.coordinates;
    const radius = this.getZoneRadius();
    feature.setGeometry(new CircleGeom(coordinates, radius));

    // 设置位置变化监听（如果位置可以改变的话）
    const disposer = reaction(
      () => dataInstance.visible,
      () => {
        feature.changed();
      }
    );

    this.featureMappings.set(dataInstance.id, {
      feature,
      dataInstance,
      disposer,
    });

    this.source.addFeature(feature);
  }

  /**
   * 移除数据实例的feature
   */
  private removeFeatureForInstance(id: number): void {
    const mapping = this.featureMappings.get(id);
    if (mapping) {
      mapping.disposer();
      this.source.removeFeature(mapping.feature);
      this.featureMappings.delete(id);
    }
  }

  /**
   * 设置数据管理器变化监听
   */
  private setupDataManagerReaction(): void {
    const disposer = reaction(
      () => this.dataManager.instances.map((i) => i.id),
      (newIds, oldIds) => {
        const oldIdSet = new Set(oldIds);
        const newIdSet = new Set(newIds);

        for (const id of oldIds) {
          if (!newIdSet.has(id)) {
            this.removeFeatureForInstance(id);
          }
        }

        for (const instance of this.dataManager.instances) {
          if (!oldIdSet.has(instance.id)) {
            this.addFeatureForInstance(instance);
          }
        }
      }
    );
    this.disposers.push(disposer);
  }

  /**
   * 设置可见性
   */
  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
  }

  /**
   * 获取可见性
   */
  public getVisible(): boolean {
    return this.layer.getVisible();
  }

  /**
   * 刷新渲染
   */
  public refresh(): void {
    this.layer.changed();
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    for (const mapping of this.featureMappings.values()) {
      mapping.disposer();
    }
    this.featureMappings.clear();

    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];

    this.source.clear();
  }
}
