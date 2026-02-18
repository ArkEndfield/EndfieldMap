export class AssetService {
  constructor(private assetHost: string) {}

  private createFullUrl(path: string) {
    if (!this.assetHost || !this.assetHost.startsWith('http')) {
      return path;
    }
    return new URL(path, this.assetHost).toString();
  }

  public get url() {
    return {
      mapImage: this.createFullUrl('/images/map'),
      mapData: this.createFullUrl('/data/map'),
      entityData: this.createFullUrl('/data/entity'),
      tierData: this.createFullUrl('/data/tier'),
      langHash: this.createFullUrl('/data/entity'),
      entityImage: this.createFullUrl('/images/icon'),
      itemData: this.createFullUrl('/dev/item'),
      itemImage: this.createFullUrl('/images/icon'),
      tierImage: this.createFullUrl('/images/tier'),
      miniGameData: this.createFullUrl('/data/minigame'),
      avatar: this.createFullUrl('/images/avatar'),
      misc: this.createFullUrl('/images/misc'),
      audio: this.createFullUrl('/audio'),
    } as const;
  }
}
