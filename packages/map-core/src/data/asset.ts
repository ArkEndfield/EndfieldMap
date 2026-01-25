/** 地图静态资源配置 */
export interface EndfieldMapAssetConfig {
  /** 地图图片 */
  mapImage: string;
  /** 实体数据地址 */
  entityData: string;
  /** 实体图片地址 */
  entityImage: string;
  /** 分层数据 */
  tierData: string;
  /** 语言哈希 */
  langHash: string;
  /** 物品数据 */
  itemData: string;
  /** 物品图片 */
  itemImage: string;
  /** 分层图片 */
  tierImage: string;
  /** 小游戏数据 */
  miniGameData: string;
  /** 头像 */
  avatar: string;
  /** 杂项 */
  misc: string;
  /** 音频 */
  audio: string;
}

/** 地图静态资源管理器 */
export class EndfieldMapAsset {
  /** 地图图片 */
  public mapImage: string;
  /** 实体数据 */
  public entityData: string;
  /** 实体图片 */
  public entityImage: string;
  /** 分层数据 */
  public tierData: string;
  /** 语言哈希 */
  public langHash: string;
  /** 物品数据 */
  public itemData: string;
  /** 物品图片 */
  public itemImage: string;
  /** 分层图片 */
  public tierImage: string;
  /** 小游戏数据 */
  public miniGameData: string;
  /** 头像 */
  public avatar: string;
  /** 杂项 */
  public misc: string;
  /** 音频 */
  public audio: string;

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
    this.entityData = config.entityData;
    this.entityImage = config.entityImage;
    this.tierData = config.tierData;
    this.langHash = config.langHash;
    this.itemData = config.itemData;
    this.itemImage = config.itemImage;
    this.tierImage = config.tierImage;
    this.miniGameData = config.miniGameData;
    this.avatar = config.avatar;
    this.misc = config.misc;
    this.audio = config.audio;
    EndfieldMapAsset.instance = this;
  }

  public static getInstance() {
    if (!EndfieldMapAsset.instance) {
      throw new Error('EndfieldMapAsset instance not initialized');
    }
    return EndfieldMapAsset.instance;
  }
}
