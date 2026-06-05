export class AssetService {
  constructor(private assetHost: string) {}

  private createFullUrl(path: string) {
    if (!this.assetHost || !this.assetHost.startsWith('http')) {
      return path;
    }
    return new URL(path, this.assetHost).toString();
  }

  public get url() {
    // TODO: 版本更新维护地址@skadi
    return {
      // 存数据的
      mapData: this.createFullUrl('/data/entity/1.3.3'),
      entityData: this.createFullUrl('/data/entity/1.3.3'),
      tierData: this.createFullUrl('/data/entity/1.3.3'),
      langHash: this.createFullUrl('/data/entity/1.3.3'),
      itemData: this.createFullUrl('/data/entity/1.3.3'),
      // TODO: 需要规范一下@skadi
      miniGameData: this.createFullUrl('/data/minigame'),
      // 存图片的
      entityImage: this.createFullUrl('/images/icon'),
      mapImage: this.createFullUrl('/images/map'),
      itemImage: this.createFullUrl('/images/icon'),
      tierImage: this.createFullUrl('/images/tier'),
      avatar: this.createFullUrl('/images/avatar'),
      misc: this.createFullUrl('/images/misc'),
      audio: this.createFullUrl('/audio'),
    } as const;
  }
}
