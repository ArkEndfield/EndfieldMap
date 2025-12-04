import { type EndfieldMapAdapter,MAP_EVENT, MapIndex, MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import {
  type Coordinate,
  type DataState,
  debounce,
  getMapCenter,
  LocalStorageKey,
  LocalStorageValue,
  logger,
} from '@endfieldmap/tools';

import { DEBOUNCE_INTERVAL } from '@/const/data';
import i18n from '@/i18n';
import { getLanguage } from '@/utils/language';

export class MapStateDataService {
  private adapter: EndfieldMapAdapter;

  public currentMap!: LocalStorageValue<MapIndex>;
  public mapZoom!: LocalStorageValue<DataState<number>>;
  public mapCenter!: LocalStorageValue<DataState<Coordinate>>;
  public adjustView!: LocalStorageValue<boolean>;
  public enableCluster!: LocalStorageValue<boolean>;
  public hoverTime!: LocalStorageValue<number>;
  public filterMarked!: LocalStorageValue<MarkedFeatureFilterMode>;
  public displayEletricPoleRange!: LocalStorageValue<boolean>;
  public displayEletricPole!: LocalStorageValue<boolean>;
  public displayCustomPoint!: LocalStorageValue<boolean>;
  public wasdMoveSpeed!: LocalStorageValue<number>;

  constructor(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;

    this.mapZoom = new LocalStorageValue<DataState<number>>({
      initialValue: {
        [MapIndex.MAP01]: 3,
        [MapIndex.MAP02]: 3,
      },
      storageKey: LocalStorageKey.MAP_ZOOM,
    });

    this.mapCenter = new LocalStorageValue<DataState<Coordinate>>({
      initialValue: {
        [MapIndex.MAP01]: getMapCenter(MapIndex.MAP01),
        [MapIndex.MAP02]: getMapCenter(MapIndex.MAP02),
      },
      storageKey: LocalStorageKey.MAP_VIEW_STATE,
    });

    this.adjustView = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.MAP_ADJUST_VIEW,
      onValueChange: (adjust) => {
        this.adapter.mapController.mapRenderer.setAdjustView(adjust);
      },
    });

    this.wasdMoveSpeed = new LocalStorageValue<number>({
      initialValue: 0.5,
      storageKey: LocalStorageKey.WASD_MOVE_SPEED,
      onValueChange: (value) => {
        this.adapter.KeyboardMoveController?.setSpeed(value);
      },
    });

    this.enableCluster = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.CLUSTER_ENABLED,
      onValueChange: (enable) => {
        this.adapter.setClusterEnable(enable);
      },
    });

    this.hoverTime = new LocalStorageValue<number>({
      initialValue: 0,
      storageKey: LocalStorageKey.HOVER_TIME,
      onValueChange: (time) => {
        if (time === -1) {
          this.adapter.setHoverFeatureEnable(false);
          this.adapter.setHoverDebounceTime(0);
        } else {
          if (!this.adapter.enableHover) {
            this.adapter.setHoverFeatureEnable(true);
          }
          this.adapter.setHoverDebounceTime(time);
        }
      },
    });

    this.filterMarked = new LocalStorageValue<MarkedFeatureFilterMode>({
      initialValue: MarkedFeatureFilterMode.All,
      storageKey: LocalStorageKey.FILTER_MARKED,
      onValueChange: (mode) => {
        this.adapter.activeFeatureController.clearActiveFeature();
        this.adapter.entityController.setMarkedFeatureFilter(mode);
      },
    });

    this.displayEletricPoleRange = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY,
      onValueChange: (data) => {
        this.adapter.electricPoleController.setZoneVisible(data);
      },
    });

    this.displayEletricPole = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.ELECTRIC_POLE_DISPLAY,
      onValueChange: (data) => {
        this.adapter.electricPoleController.setElectricPoleVisible(data);
      },
    });

    this.displayCustomPoint = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.CUSTOM_POINT_DISPLAY,
      onValueChange: (data) => {
        this.adapter.customPointController.setCustomPointVisible(data);
      },
    });

    // 初始化所有 LocalStorageValue 实例，确保 this 上下文正确
    this.currentMap = new LocalStorageValue<MapIndex>({
      initialValue: MapIndex.MAP01,
      storageKey: LocalStorageKey.MAP_CURRENT_MAP,
      onValueChange: (data) => {
        this.renderMap(data);
      },
    });

    this.initStateDataEventListener();
  }

  public initStateDataEventListener() {
    // 地图缩放监听事件
    this.adapter.event.on(
      MAP_EVENT.ZOOM_CHANGE,
      debounce((zoom: number) => {
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapZoom(currentMap, zoom);
      }, DEBOUNCE_INTERVAL)
    );
    // 地图视图移动事件
    this.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      debounce((center?: Coordinate) => {
        if (!center) return;
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapCenter(currentMap, center);
      }, DEBOUNCE_INTERVAL)
    );
  }

  /**
   * 设置地图缩放级别
   * @param mapIndex 地图id
   * @param zoom 缩放级别
   */
  public setMapZoom(mapIndex: MapIndex, zoom: number) {
    this.mapZoom.value = {
      ...this.mapZoom.value,
      [mapIndex]: zoom,
    };
  }

  public setMapCenter(mapIndex: MapIndex, center: Coordinate) {
    this.mapCenter.value = {
      ...this.mapCenter.value,
      [mapIndex]: center,
    };
  }

  public renderMap(mapIndex: MapIndex) {
    try {
      this.adapter.renderMap(mapIndex);

      // 渲染实体
      this.adapter.renderEntity(mapIndex).catch((e) => {
        logger.error('[EndfieldMapAdapter | renderEntity] error, ', e);
      });
      // 设置地图名称
      this.adapter.renderAreaName(getLanguage(i18n.languages));
      // 渲染电线杆
      this.adapter.renderElectricPole(mapIndex);
      // 渲染自定义标点
      this.adapter.renderCustomPoint(mapIndex);
      // 设置地图中心
      this.adapter.mapController.setCenter(this.mapCenter.value[mapIndex]);
      // 设置地图缩放
      this.adapter.mapController.setZoom(this.mapZoom.value[mapIndex]);
    } catch (e) {
      logger.error('[EndfieldMapAdapter | renderMap] error, ', e);
    }
  }
}
