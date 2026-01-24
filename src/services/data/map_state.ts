import {
  DEFAULT_ZOOM,
  type EndfieldMapAdapter,
  MAP_EVENT,
  type MapData,
  MarkedFeatureFilterMode,
  type Coordinate,
} from '@endfieldmap/map-core';
import { debounce, LocalStorageKey, LocalStorageValue, logger } from '@endfieldmap/tools';

import { DEBOUNCE_INTERVAL } from '@/const/data';
import i18n from '@/i18n';
import { getLanguage } from '@/utils/language';

export interface DevToolsState {
  position: { right: number; top: number };
  panelCollapsed?: boolean;
  showCursorPosition?: boolean;
  drawPanelOpen?: boolean;
  drawPanelPosition?: { right: number; top: number };
}

import { loadingManager } from '@/services/loading';

interface DataState<T> {
  [key: MapData['id']]: T;
}

export class MapStateDataService {
  private adapter: EndfieldMapAdapter;

  public currentMap!: LocalStorageValue<MapData['id']>;
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
  public devToolsState!: LocalStorageValue<DevToolsState>;

  constructor(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
    const mapDataManager = this.adapter.mapController.dataManager;
    const firstMapId = mapDataManager.mapIds[0];

    this.mapZoom = new LocalStorageValue<DataState<number>>({
      initialValue: {},
      storageKey: LocalStorageKey.MAP_ZOOM,
    });

    this.mapCenter = new LocalStorageValue<DataState<Coordinate>>({
      initialValue: {},
      storageKey: LocalStorageKey.MAP_VIEW_STATE,
    });

    this.adjustView = new LocalStorageValue<boolean>({
      initialValue: false,
      storageKey: LocalStorageKey.MAP_ADJUST_VIEW,
      onValueChange: (adjust) => {
        this.adapter.mapController.olMapRenderer.setAdjustView(adjust);
      },
    });

    this.wasdMoveSpeed = new LocalStorageValue<number>({
      initialValue: 0.5,
      storageKey: LocalStorageKey.WASD_MOVE_SPEED,
      onValueChange: (value) => {
        this.adapter.KeyboardMoveController?.setSpeed(value);
      },
    });

    this.devToolsState = new LocalStorageValue<DevToolsState>({
      initialValue: {
        position: { right: 20, top: 20 },
        panelCollapsed: false,
        showCursorPosition: false,
        drawPanelOpen: false,
        drawPanelPosition: { right: 20, top: 80 },
      },
      storageKey: LocalStorageKey.DEV_TOOLS_STATE,
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
        this.adapter.entityController.setMarkedFilterMode(mode);
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
        this.adapter.electricPoleController.setVisible(data);
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
    this.currentMap = new LocalStorageValue<MapData['id']>({
      initialValue: firstMapId,
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
        const currentMap = this.adapter!.mapController.dataManager.currentMapId;
        this.setMapZoom(currentMap, zoom);
      }, DEBOUNCE_INTERVAL)
    );
    // 地图视图移动事件
    this.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      debounce((center?: Coordinate) => {
        if (!center) return;
        const currentMap = this.adapter!.mapController.dataManager.currentMapId;
        this.setMapCenter(currentMap, center);
      }, DEBOUNCE_INTERVAL)
    );
  }

  /**
   * 设置地图缩放级别
   * @param mapId 地图id
   * @param zoom 缩放级别
   */
  public setMapZoom(mapId: MapData['id'], zoom: number) {
    this.mapZoom.value = {
      ...this.mapZoom.value,
      [mapId]: zoom,
    };
  }

  public setMapCenter(mapId: MapData['id'], center: Coordinate) {
    this.mapCenter.value = {
      ...this.mapCenter.value,
      [mapId]: center,
    };
  }

  public renderMap(mapId: MapData['id']) {
    try {
      this.adapter.renderMap(mapId);
      const mapData = this.adapter.mapController.dataManager.getMapData(mapId);
      if (!mapData) {
        logger.error('[EndfieldMapAdapter | renderMap] mapData not found', mapId);
        return;
      }

      // 设置地图名称
      this.adapter.renderAreaName(getLanguage(i18n.languages));
      // 设置地图中心
      let center: Coordinate | undefined = this.mapCenter.value?.[mapId];
      if (!Array.isArray(center) || center.length < 2) {
        center = this.adapter.mapController.dataManager.getMapCenter(mapId);
      }
      this.adapter.mapController.setCenter(center);
      // 设置地图缩放
      const zoom = this.mapZoom.value?.[mapId] ?? mapData.zoom?.default ?? DEFAULT_ZOOM;
      this.adapter.mapController.setZoom(zoom);
    } catch (e) {
      loadingManager.setError(e as Error);
      logger.error('[EndfieldMapAdapter | renderMap] error, ', e);
    }
  }
}
