import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { DEFAULT_ZOOM } from '@endfieldmap/map-core/const';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type { AreaNameFeatureStyle, AreaNameLayerConfig } from '@endfieldmap/map-core/render/layers/area_name';
import { AreaNameLayer } from '@endfieldmap/map-core/render/layers/area_name';
import { reaction } from 'mobx';

export interface AreaNameControllerConfig extends AreaNameLayerConfig {
  mapDataManager: MapDataManager;
  emitter: EndfieldMapEmitter;
}

export class AreaNameController extends Disposer {
  public areaNameLayer: AreaNameLayer;
  private getNameFunction?: <T extends string>(name: T) => string;
  private currentZoom: number = DEFAULT_ZOOM;
  private mapDataManager: MapDataManager;
  private emitter: EndfieldMapEmitter;

  constructor(config: AreaNameControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.emitter = config.emitter;
    this.areaNameLayer = new AreaNameLayer(config.mapDataManager, {
      ...config,
      getName: (name) => this.getName(name),
    });
    this.emitter.on(MAP_EVENT.ZOOM_CHANGE, this.setAreaName.bind(this));
    this.initListener();
  }

  private initListener() {
    this.disposers.push(
      reaction(
        () => this.mapDataManager.currentMapId,
        () => {
          this.refresh();
        }
      )
    );
  }

  public registerNameFunction(fn: <T extends string>(name: T) => string) {
    this.getNameFunction = fn;
    this.refresh();
  }

  public getName<T extends string>(name: T) {
    return this.getNameFunction?.(name) || 'name';
  }

  public async setAreaName(_zoom?: number) {
    if (!this.getNameFunction) return;
    const zoom = _zoom ?? this.mapDataManager.currentMap?.zoom?.default ?? DEFAULT_ZOOM;
    const currentMapId = this.mapDataManager.currentMapId;
    if (!currentMapId) return;

    const regions = this.mapDataManager.currentMap?.regions;
    if (!regions) return;

    this.currentZoom = zoom;

    if (zoom >= 3) {
      const overrides = regions.flatMap((region) => region.overrides);
      this.areaNameLayer.setAreaName(overrides, currentMapId);
    } else {
      this.areaNameLayer.setAreaName(regions, currentMapId);
    }
  }

  /**
   * 刷新图层
   */
  public refresh() {
    this.setAreaName(this.currentZoom);
  }

  /**
   * 改变文本描边颜色
   * @param color 文本描边颜色
   */
  public changeStrokeColor(color: string) {
    this.areaNameLayer.changeStrokeColor(color);
    this.refresh();
  }

  /**
   * 改变文本描边宽度
   * @param width 文本描边宽度
   */
  public changeTextStrokeWidth(width: number) {
    this.areaNameLayer.changeTextStrokeWidth(width);
    this.refresh();
  }

  /**
   * 改变文本字体
   * @param font 文本字体
   */
  public changeTextFont(font: string) {
    this.areaNameLayer.changeTextFont(font);
    this.refresh();
  }

  /**
   * 改变样式
   * @param style 样式
   */
  public changeStyle(style: AreaNameFeatureStyle) {
    this.areaNameLayer.changeStyle(style);
    this.refresh();
  }
}
