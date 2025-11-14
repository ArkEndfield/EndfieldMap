import { MAP_EVENT, type EndfieldMapAdapter, type EntityVisibilityChangeEventDetail, type FeatureStateChangeEventDetail } from '@endfieldmap/map-core';
import {
  getMapCenter,
  LocalStorageDB,
  LocalStorageKey,
  MapIndex,
  type DataState,
  type Coordinate,
  throttle,
  StorageManager,
  JSONLoader,
} from '@endfieldmap/tools';
import { EntityDataService } from './entity';

const THROTTLE_INTERVAL = 1000;

class DataService {
  public storage: StorageManager;
  public jsonLoader: JSONLoader;
  public initialized: boolean = false;
  private adapter: EndfieldMapAdapter | null = null;

  public entityDataService: EntityDataService;

  constructor() {
    this.storage = new StorageManager({
      name: 'endfieldmap',
      version: 1,
      description: 'EndfieldMap Storage',
    });
    this.jsonLoader = new JSONLoader({
      storage: this.storage,
    });
    this.entityDataService = new EntityDataService(this.storage);
  }

  public async init() {
    if (this.initialized) return;
    await this.storage.init();
    await this.entityDataService.initFromStorage();
    this.initialized = true;
  }

  public registerAdapter(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
    this.initDataEventListeners();
  }

  public initDataEventListeners() {
    if (!this.adapter) return;
    this.adapter.event.on(
      MAP_EVENT.ENTITY_VISIBILITY_CHANGE,
      (event: EntityVisibilityChangeEventDetail) => {
        const currentMap = this.adapter!.currentMapIndex;
        for (const layer of event.layers) {
          this.entityDataService.updateEntityVisibility(currentMap, layer.entityDataIdKey, layer.visible);
        }
      }
    );

    this.adapter.event.on(
      MAP_EVENT.FEATURE_STATE_CHANGE,
      (event: FeatureStateChangeEventDetail) => {
        const currentMap = this.adapter!.currentMapIndex;
        if (event.property === 'marked') {
          this.entityDataService.updateFeatureMarked(currentMap, event.feature.data.levelLogicId, event.newValue);
        }
      }
    );
  
    this.adapter.event.on(
      MAP_EVENT.ZOOM_CHANGE,
      throttle((zoom: number) => {
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapZoom(currentMap, zoom);
      }, THROTTLE_INTERVAL)
    );
  
    this.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      throttle((center?: Coordinate) => {
        if (!center) return;
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapCenter(currentMap, center);
      }, THROTTLE_INTERVAL)
    );
  }
  
  public setMapCenter(mapIndex: MapIndex, center: Coordinate) {
    const originData =
      LocalStorageDB.get<DataState<Coordinate>>(LocalStorageKey.MAP_VIEW_STATE) || ({} as DataState<Coordinate>);
    originData[mapIndex] = center;
    LocalStorageDB.set(LocalStorageKey.MAP_VIEW_STATE, originData);
  }
  
  public setMapZoom(mapIndex: MapIndex, zoom: number) {
    const originData = LocalStorageDB.get<DataState<number>>(LocalStorageKey.MAP_ZOOM) || ({} as DataState<number>);
    originData[mapIndex] = zoom;
    LocalStorageDB.set(LocalStorageKey.MAP_ZOOM, originData);
  }
  
  public setCurrentMap(mapIndex: MapIndex) {
    LocalStorageDB.set(LocalStorageKey.MAP_CURRENT_MAP, mapIndex);
  }
  
  /**
   * 从LocalStorage中获取数据
   * @returns 数据
   */
  public getDataFromLocalStorage() {
    const currentMap = LocalStorageDB.get<MapIndex>(LocalStorageKey.MAP_CURRENT_MAP) || MapIndex.MAP01;
    const zoom = LocalStorageDB.get<DataState<number>>(LocalStorageKey.MAP_ZOOM)?.[currentMap] ?? 3;
    const center =
      LocalStorageDB.get<DataState<Coordinate>>(LocalStorageKey.MAP_VIEW_STATE)?.[currentMap] ?? getMapCenter(currentMap);
    return {
      zoom,
      center,
      currentMap: currentMap,
    };
  }
}

export const dataService = new DataService();
