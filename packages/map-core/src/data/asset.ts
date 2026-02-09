/** 地图静态资源配置 */
export interface EndfieldMapAssetConfig {
  /** 地图图片 */
  mapImage: string;
  /** 实体图片地址 */
  entityImage: string;
}

/** 地图静态资源管理器 */
export class EndfieldMapAsset {
  /** 地图图片 */
  public mapImage: string;
  /** 实体图片 */
  public entityImage: string;

  /**
   * 初始化静态资源管理器
   * @param config 静态资源配置
   */
  constructor(config: EndfieldMapAssetConfig) {
    this.mapImage = config.mapImage;
    this.entityImage = config.entityImage;
  }
}
