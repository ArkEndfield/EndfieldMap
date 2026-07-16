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
      // 存数据的
      mapData: this.createFullUrl('/output_beyondmap'),
      entityData: this.createFullUrl('/output_beyondmap'),
      tierData: this.createFullUrl('/output_beyondmap'),
      langHash: this.createFullUrl('/output_beyondmap'),
      // i18n lang 命名空间：运行时按 locale 从 CDN 外部加载
      // 完整地址为 `${langI18n}/${locale}/lang.json`
      langI18n: this.createFullUrl('/output_beyondmap/i18n'),
      itemData: this.createFullUrl('/output_beyondmap'),
      miniGameData: this.createFullUrl('/output_beyondmap/minigame'),
      // 存图片的
      entityImage: this.createFullUrl('/output_image/itemiconbig'),
      mapImage: "https://assets.zmdmap.com/images/map",
      itemImage: this.createFullUrl('/output_image/itemiconbig'),
      tierImage: this.createFullUrl('/output_image/tier'),
      avatar: 'https://assets.zmdmap.com/images/avatar',
      misc: 'https://assets.zmdmap.com/images/misc',
      audio: "https://assets.zmdmap.com/audio",
    } as const;
  }
}
