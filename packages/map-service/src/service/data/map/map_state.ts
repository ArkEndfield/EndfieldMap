import {
  DEFAULT_ZOOM,
  MAP_EVENT,
  type MapCoordinate,
  type MapData,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core';
import { DEBOUNCE_INTERVAL } from '@endfieldmap/map-service/const/data';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { debounce, LocalStorageKey, LocalStorageValue, logger } from '@endfieldmap/tools';

export interface DevToolsState {
  position: { right: number; top: number };
  panelCollapsed?: boolean;
  showCursorPosition?: boolean;
  drawPanelOpen?: boolean;
  drawPanelPosition?: { right: number; top: number };
}

interface DataState<T> {
  [key: MapData['id']]: T;
}

export class MapStateDataService {
  private adapterRegistry: AdapterRegistry;

  public currentMap!: LocalStorageValue<MapData['id']>;
  public mapZoom!: LocalStorageValue<DataState<number>>;
  public mapCenter!: LocalStorageValue<DataState<MapCoordinate>>;
  public adjustView!: LocalStorageValue<boolean>;
  public enableCluster!: LocalStorageValue<boolean>;
  public hoverTime!: LocalStorageValue<number>;
  public filterMarked!: LocalStorageValue<MarkedFeatureFilterMode>;
  public displayEletricPoleRange!: LocalStorageValue<boolean>;
  public displayEletricPole!: LocalStorageValue<boolean>;
  public displayCustomPoint!: LocalStorageValue<boolean>;
  public wasdMoveSpeed!: LocalStorageValue<number>;
  public devToolsState!: LocalStorageValue<DevToolsState>;

  constructor(adapterRegistry: AdapterRegistry) {
    this.adapterRegistry = adapterRegistry;

    this.mapZoom = new LocalStorageValue<DataState<number>>({
      initialValue: {},
      storageKey: LocalStorageKey.MAP_ZOOM,
    });

    this.mapCenter = new LocalStorageValue<DataState<MapCoordinate>>({
      initialValue: {},
      storageKey: LocalStorageKey.MAP_VIEW_STATE,
    });

    this.adjustView = new LocalStorageValue<boolean>({
      initialValue: false,
      storageKey: LocalStorageKey.MAP_ADJUST_VIEW,
    });

    this.wasdMoveSpeed = new LocalStorageValue<number>({
      initialValue: 0.5,
      storageKey: LocalStorageKey.WASD_MOVE_SPEED,
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
    });

    this.hoverTime = new LocalStorageValue<number>({
      initialValue: 0,
      storageKey: LocalStorageKey.HOVER_TIME,
    });

    this.filterMarked = new LocalStorageValue<MarkedFeatureFilterMode>({
      initialValue: MarkedFeatureFilterMode.All,
      storageKey: LocalStorageKey.FILTER_MARKED,
    });

    this.displayEletricPoleRange = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY,
    });

    this.displayEletricPole = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.ELECTRIC_POLE_DISPLAY,
    });

    this.displayCustomPoint = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: LocalStorageKey.CUSTOM_POINT_DISPLAY,
    });

    this.currentMap = new LocalStorageValue<MapData['id']>({
      initialValue: 'unselected',
      storageKey: LocalStorageKey.MAP_CURRENT_MAP,
    });
  }

  public async init() {
    this.adjustView.registerOnValueChange((adjust) => {
      this.adapterRegistry.adapter.mapController.setAdjustView?.(adjust);
    });

    this.wasdMoveSpeed.registerOnValueChange((value) => {
      this.adapterRegistry.adapter.setKeyboardMoveSpeed?.(value);
    });

    this.enableCluster.registerOnValueChange((enable) => {
      this.adapterRegistry.adapter.setClusterEnable(enable);
    });

    this.hoverTime.registerOnValueChange((time) => {
      if (time === -1) {
        this.adapterRegistry.adapter.setHoverFeatureEnable(false);
        this.adapterRegistry.adapter.setHoverDebounceTime(0);
      } else {
        if (!this.adapterRegistry.adapter.enableHover) {
          this.adapterRegistry.adapter.setHoverFeatureEnable(true);
        }
        this.adapterRegistry.adapter.setHoverDebounceTime(time);
      }
    });

    this.filterMarked.registerOnValueChange((mode) => { 
      this.adapterRegistry.adapter.activeFeatureController.clearActiveFeature();
      this.adapterRegistry.adapter.entityController.setMarkedFilterMode(mode);
    });

    this.displayEletricPoleRange.registerOnValueChange((visible) => {
      this.adapterRegistry.adapter.electricPoleController.setZoneVisible(visible);
    });

    this.displayEletricPole.registerOnValueChange((visible) => {
      this.adapterRegistry.adapter.electricPoleController.setVisible(visible);
    });
    
    this.displayCustomPoint.registerOnValueChange((visible) => {
      this.adapterRegistry.adapter.customPointController.setCustomPointVisible(visible);
    });

    if (this.currentMap.value === 'unselected') {
      this.currentMap.value = this.adapterRegistry.adapter.mapController.dataManager.mapIds[0];
    }

    this.currentMap.registerOnValueChange((mapId) => {
      this.renderMap(mapId);
    });

    this.initStateDataEventListener();
  }

  public initStateDataEventListener() {
    this.adapterRegistry.adapter.event.on(
      MAP_EVENT.ZOOM_CHANGE,
      debounce((zoom) => {
        const currentMap = this.adapterRegistry.adapter.mapController.dataManager.currentMapId;
        this.setMapZoom(currentMap, zoom);
      }, DEBOUNCE_INTERVAL)
    );
    this.adapterRegistry.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      debounce((center) => {
        if (!center) return;
        const currentMap = this.adapterRegistry.adapter.mapController.dataManager.currentMapId;
        this.setMapCenter(currentMap, center);
      }, DEBOUNCE_INTERVAL)
    );
  }

  public setMapZoom(mapId: MapData['id'], zoom: number) {
    this.mapZoom.value = {
      ...this.mapZoom.value,
      [mapId]: zoom,
    };
  }

  public setMapCenter(mapId: MapData['id'], center: MapCoordinate) {
    this.mapCenter.value = {
      ...this.mapCenter.value,
      [mapId]: center,
    };
  }

  public renderMap(mapId: MapData['id']) {
    try {
      this.adapterRegistry.adapter.renderMap(mapId);
      const mapData = this.adapterRegistry.adapter.mapController.dataManager.getMapData(mapId);
      if (!mapData) {
        logger.error('[EndfieldMapAdapter | renderMap] mapData not found', mapId);
        return;
      }

      const zoom = this.mapZoom.value?.[mapId] ?? mapData.zoom?.default ?? DEFAULT_ZOOM;
      this.adapterRegistry.adapter.mapController.setZoom(zoom);

      let center: MapCoordinate | undefined = this.mapCenter.value?.[mapId];
      if (!Array.isArray(center) || center.length < 2) {
        center = this.adapterRegistry.adapter.mapController.dataManager.getMapCenter(mapId);
      }
      this.adapterRegistry.adapter.mapController.setCenter(center);
    } catch (e) {
      serviceEmitter.fire(SERVICE_EVENT.LOADING_ERROR, { error: e as Error });
      logger.error('[EndfieldMapAdapter | renderMap] error, ', e);
    }
  }

  public setCurrentMap(mapId: MapData['id']) {
    this.currentMap.value = mapId;
  }
}
