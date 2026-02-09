import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export class TierDataInstance {
  public mapId: MapData['id'];
  public data: GridTierItem['items'][number];
  public position: Coordinate;
  public extentExtra: Coordinate = [0, 0];
  @observable accessor visible: boolean = true;
  public readonly mapDataManager: MapDataManager;

  constructor(mapId: MapData['id'], data: GridTierItem['items'][number], position: Coordinate, mapDataManager: MapDataManager) {
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

  get extent() {
    const [crdX, crdY] = this.mapDataManager.xyz2crd({ x: this.x, y: 0, z: this.y }, this.mapId);
    const extent: [number, number, number, number] = [
      crdX,
      crdY,
      crdX + this.extentExtra[0],
      crdY + this.extentExtra[1],
    ];
    return extent;
  }

  public setExtentExtra(position: Coordinate) {
    this.extentExtra = position;
  }
}
