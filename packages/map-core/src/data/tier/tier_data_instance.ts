import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { observable } from 'mobx';

export class TierDataInstance {
  public mapId: MapData['id'];
  public data: GridTierItem['items'][number];
  public position: MapCoordinate;
  public extentExtra: MapCoordinate = [0, 0];
  @observable accessor visible: boolean = true;
  public readonly mapDataManager: MapDataManager;

  constructor(mapId: MapData['id'], data: GridTierItem['items'][number], position: MapCoordinate, mapDataManager: MapDataManager) {
    this.mapId = mapId;
    this.data = data;
    this.position = position;
    this.mapDataManager = mapDataManager;
  }

  get id() {
    return this.data.id;
  }

  get imageUrl() {
    return this.data.imagePath;
  }

  get index() {
    return this.data.index;
  }

  get x() {
    return this.position[0];
  }

  get y() {
    return this.position[1];
  }

  get extent(): [number, number, number, number] {
    const [crdX, crdY] = this.mapDataManager.xyz2crd({ x: this.x, y: 0, z: this.y }, this.mapId);
    // 有精确范围（tier_volumes.json）时直接用；否则按图片尺寸从左下角推算
    const bounds = this.data.bounds;
    if (bounds) {
      const [rtX, rtY] = this.mapDataManager.xyz2crd({ x: bounds.rt[0], y: 0, z: bounds.rt[1] }, this.mapId);
      return [crdX, crdY, rtX, rtY];
    }
    const extent: [number, number, number, number] = [
      crdX,
      crdY,
      crdX + this.extentExtra[0],
      crdY + this.extentExtra[1],
    ];
    return extent;
  }

  public setExtentExtra(position: MapCoordinate) {
    this.extentExtra = position;
  }
}
