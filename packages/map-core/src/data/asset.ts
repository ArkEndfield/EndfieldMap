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

  /** 实例 */
  public static instance: EndfieldMapAsset;

  /**
   * 初始化静态资源管理器
   * @param config 静态资源配置
   */
  constructor(config: EndfieldMapAssetConfig) {
    if (EndfieldMapAsset.instance) {
      throw new Error('EndfieldMapAsset instance already exists');
    }
    this.mapImage = config.mapImage;
    this.entityImage = config.entityImage;
    EndfieldMapAsset.instance = this;
  }

  public static getInstance() {
    if (!EndfieldMapAsset.instance) {
      throw new Error('EndfieldMapAsset instance not initialized');
    }
    return EndfieldMapAsset.instance;
  }
}
