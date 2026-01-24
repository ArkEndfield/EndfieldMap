import { DEFAULT_ZOOM } from '@endfieldmap/map-core/const';
import type { MapData } from '@endfieldmap/map-core/types';
import type { AreaNameData, UnionAreaName } from '@endfieldmap/map-core/types/area_name';
import type { JSONLoader, Language } from '@endfieldmap/tools';

export interface AreaNameDataManagerConfig {
  jsonLoader: JSONLoader;
  assetPath: string;
}

export type AreaNameDataKey = `${MapData['id']}.${Language}`;

export class AreaNameDataManager {
  private jsonLoader: JSONLoader;
  private assetPath: string;
  private data: Map<AreaNameDataKey, AreaNameData> = new Map();
  public language: Language | null;
  public mapId: MapData['id'] | null;
  public zoom: number;

  constructor(config: AreaNameDataManagerConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetPath = config.assetPath;
    this.language = null;
    this.mapId = null;
    this.zoom = DEFAULT_ZOOM;
  }

  private getDetailedData(data: AreaNameData, zoom: number): UnionAreaName {
    const detailedData = zoom >= 3.5 ? data.override : data.base;
    return detailedData;
  }

  public async loadData(mapId: MapData['id'], language: Language): Promise<AreaNameData | null> {
    const data = await this.jsonLoader.loadJSON<AreaNameData>(`${this.assetPath}/${language}/${mapId}.json`);
    if (data) {
      const key: AreaNameDataKey = `${mapId}.${language}`;
      this.data.set(key, data);
    }
    return data || null;
  }

  public async getAreaNameData(mapId: MapData['id'], language: Language, zoom: number): Promise<UnionAreaName | null> {
    const key: AreaNameDataKey = `${mapId}.${language}`;
    let data = this.data.get(key) ?? null;
    if (!data) {
      data = await this.loadData(mapId, language);
      if (!data) {
        return this.currentData;
      }
    }
    this.mapId = mapId;
    this.language = language;
    this.zoom = zoom;
    return this.getDetailedData(data, zoom);
  }

  get currentData(): UnionAreaName | null {
    if (!this.mapId || !this.language || !this.zoom) return null;
    const currentKey: AreaNameDataKey = `${this.mapId}.${this.language}`;
    const data = this.data.get(currentKey) ?? null;
    return data ? this.getDetailedData(data, this.zoom) : null;
  }
}
