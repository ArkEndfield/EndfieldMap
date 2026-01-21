import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { xyz2crd } from '@endfieldmap/tools';
import { observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export class TierDataInstance {
  public mapIndex: MapIndex;
  public data: GridTierItem['items'][number];
  public position: Coordinate;
  public extentExtra: Coordinate = [0, 0];
  @observable accessor visible: boolean = true;

  constructor(mapIndex: MapIndex, data: GridTierItem['items'][number], position: Coordinate) {
    this.mapIndex = mapIndex;
    this.data = data;
    this.position = position;
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
    const [crdX, crdY] = xyz2crd({ x: this.x, y: 0, z: this.y }, this.mapIndex);
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
