import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { DEFAULT_OPACITY, LayerType, LayerTypeKey, MapType, MapTypeKey } from '@endfieldmap/map-core/const/map';
import { MultiLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { ImagePool } from '@endfieldmap/tools';
import { observable } from 'mobx';
import type { Tile } from 'ol';
import { ImageTile } from 'ol';
import TileLayer from 'ol/layer/Tile';
import type { Projection } from 'ol/proj';
import { XYZ } from 'ol/source';

const emptyImageBase64String = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const emptyImage = new Image();
emptyImage.src = emptyImageBase64String;

export interface MapLayerConfig {
  /** 透明度 */
  opacity?: number;
  /** 投影 */
  projection?: Projection;
  /** 缓存大小 */
  cacheSize?: number;
  /** 瓦片URL */
  tileUrl: string;
}

/** 地图图层 */
export class MapLayer extends MultiLayerBase {
  /** 图层实例 */
  public layer: TileLayer;
  /** 地下一层 */
  public underLevel1Layer: TileLayer;
  /** 配置 */
  @observable accessor config: MapLayerConfig;
  /** 缓存 source */
  private cacheSource: Map<MapIndex, XYZ> = new Map();

  constructor(config: MapLayerConfig) {
    super();
    this.config = config;
    this.layer = new TileLayer({
      opacity: config.opacity ?? 1,
      preload: 2, // 预加载2个层级的瓦片，减少缩放时的闪烁
      useInterimTilesOnError: true, // 加载出错时使用临时瓦片
      zIndex: -2,
    });
    this.layer.set(LayerTypeKey, LayerType.MAP);
    this.layer.set(MapTypeKey, MapType.MAP);
    this.underLevel1Layer = new TileLayer({
      opacity: config.opacity ?? DEFAULT_OPACITY,
      preload: 2, // 预加载2个层级的瓦片，减少缩放时的闪烁
      useInterimTilesOnError: true, // 加载出错时使用临时瓦片
    });
    this.underLevel1Layer.set(LayerTypeKey, LayerType.MAP);
    this.underLevel1Layer.set(MapTypeKey, MapType.MAP_UNDER_LEVEL_1);
  }

  /**
   * 瓦片加载函数
   * @param tile 瓦片
   * @param src 瓦片URL
   */
  private tileLoadFunction = (tile: Tile, src: string) => {
    if (tile instanceof ImageTile) {
      if (src === emptyImageBase64String) {
        tile.setImage(emptyImage);
      } else {
        const img = ImagePool.getImage(src);
        if (img.isPool || img.image.complete || img.image.width > 0 || img.image.height > 0) {
          tile.setImage(img.image);
        } else {
          img.image.src = src;
          img.image.onload = () => {
            tile.setImage(img.image);
          };
          img.image.onerror = () => {
            tile.setImage(emptyImage);
          };
        }
      }
    }
  };

  /**
   * 所有图层
   * @returns 图层实例集合
   */
  get layers(): TileLayer[] {
    return [this.layer, this.underLevel1Layer];
  }

  /**
   * 创建基础瓦片源
   * @param mapIndex 地图索引
   * @returns 基础瓦片源
   */
  public createBaseTileSource(mapIndex: MapIndex): XYZ {
    return new XYZ({
      projection: this.config.projection,
      url: `${this.config.tileUrl}/${mapIndex}/{z}/{y}/{x}.png`,
      tileLoadFunction: this.tileLoadFunction,
      cacheSize: this.config.cacheSize ?? 500,
    });
  }

  /**
   * 渲染地图
   * @param mapIndex 地图索引
   */
  public renderMap(mapIndex: MapIndex) {
    let newSource = this.cacheSource.get(mapIndex);
    if (!newSource) {
      newSource = this.createBaseTileSource(mapIndex);
      this.cacheSource.set(mapIndex, newSource);
    }
    this.layer.setSource(newSource);
  }
}
