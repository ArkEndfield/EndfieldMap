import { makeObservable, computed, action } from 'mobx';
import type { TierData } from '../../types/tier';

export class TierDataInstance {
  mapIndex: string;
  level: number;
  x: number;
  y: number;
  imageUrl: string;
  extent: [number, number, number, number];
  private _visible: boolean = true;

  constructor(data: TierData) {
    this.mapIndex = data.mapIndex;
    this.level = data.level;
    this.x = data.x;
    this.y = data.y;
    this.imageUrl = data.imageUrl;
    this.extent = data.extent;

    makeObservable(this, {
      visible: computed,
      setVisible: action,
    });
  }

  get id(): string {
    return `${this.mapIndex}_${this.x}_${this.y}_${this.level}`;
  }

  get visible(): boolean {
    return this._visible;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
  }
}
