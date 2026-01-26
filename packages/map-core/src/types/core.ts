import { MapDataJson } from '@endfieldmap/map-core/types/map';
import { JSONLoader, StorageManager } from '@endfieldmap/tools';

export interface ControllersBaseCoreParams {
  // data 管理器
  jsonLoader: JSONLoader;
  storage: StorageManager;

  data: MapDataJson;
}

export interface MapCoreParams extends ControllersBaseCoreParams {}
