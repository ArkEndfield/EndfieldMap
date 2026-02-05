import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import { getElectricPoleDeviceConfig } from '@endfieldmap/map-core/const/electric_pole';
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
} from '@endfieldmap/map-core/const/map';
import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import {
  createBaseEntityBackgroundStyle,
  createBlurredShadowStyles,
  createEntityIconStyles,
} from '@endfieldmap/map-core/render/factory';
import type { FeatureLike } from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface ElectricPoleStyleConfig {
  iconSize?: number;
  enableShadow?: boolean;
}

export class ElectricPoleStyleProvider {
  /** 样式缓存 */
  private styleCache: Map<string, Style[]> = new Map();

  /** 图标样式缓存 */
  private iconStyleCache: Map<string, Style> = new Map();

  /** 是否启用阴影 */
  private enableShadow: boolean;

  /** 图标大小 */
  private iconSize: number;

  /** 阴影样式 */
  private static BASE_BACKDROP_STYLE: Style[] = [];

  /** 连线普通样式 */
  private static readonly CONNECTION_STYLE_NORMAL = new Style({
    stroke: new Stroke({
      color: '#FFD700',
      width: 2,
    }),
  });

  /** 连线hover样式 */
  private static readonly CONNECTION_STYLE_HOVER = new Style({
    stroke: new Stroke({
      color: '#FFA500',
      width: 4,
    }),
  });

  constructor(config: ElectricPoleStyleConfig) {
    this.enableShadow = config.enableShadow ?? false;
    this.iconSize = config.iconSize ?? DEFAULT_ICON_SIZE;

    // 初始化阴影样式
    if (this.enableShadow && ElectricPoleStyleProvider.BASE_BACKDROP_STYLE.length === 0) {
      ElectricPoleStyleProvider.BASE_BACKDROP_STYLE = [createBlurredShadowStyles(ENTITY_RADIUS)];
    }
  }

  /**
   * 生成样式缓存键
   */
  private generateStyleCacheKey(deviceKey: ElectricPoleDeviceKey, state: 'active' | 'normal'): string {
    return `${deviceKey}-${state}`;
  }

  /**
   * 创建实体样式
   */
  public createEntityStyle(feature: FeatureLike): Style[] {
    const dataInstance = feature.get(EntityInstanceKey) as ElectricPoleDataInstance | undefined;
    if (!dataInstance) {
      return [];
    }
    if (!dataInstance.visible) {
      return [];
    }

    // 根据状态计算透明度
    const state: 'active' | 'normal' = dataInstance.active ? 'active' : 'normal';
    const cacheKey = this.generateStyleCacheKey(dataInstance.deviceKey, state);

    const cachedStyle = this.styleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const bgStyles = createBaseEntityBackgroundStyle(
      ENTITY_RADIUS,
      DEFAULT_STROKE_WIDTH,
      DEFAULT_FILL_COLOR,
      DEFAULT_STROKE_COLOR
    );
    const iconStyle = this.getOrCreateIconStyle(dataInstance.deviceKey);
    const styles: Style[] = this.enableShadow
      ? [...ElectricPoleStyleProvider.BASE_BACKDROP_STYLE, ...bgStyles, iconStyle]
      : [...bgStyles, iconStyle];

    this.styleCache.set(cacheKey, styles);
    return styles;
  }

  private getOrCreateIconStyle(deviceKey: ElectricPoleDeviceKey): Style {
    const cached = this.iconStyleCache.get(deviceKey);
    if (cached) return cached;
    const imagePath = EndfieldMapAsset.getInstance().entityImage;
    const { iconPic } = getElectricPoleDeviceConfig(deviceKey);
    const style = createEntityIconStyles({
      url: `${imagePath}/${iconPic}.png`,
      size: this.iconSize,
      radius: ENTITY_RADIUS,
      borderWidth: 3,
    });
    this.iconStyleCache.set(deviceKey, style);
    return style;
  }

  /**
   * 创建连线样式
   * @param feature 连线feature
   * @param hoveredFeature 当前hover的features
   * @returns 样式
   */
  public createConnectionStyle(feature: FeatureLike, hoveredFeature: FeatureLike | null): Style {
    const isHovered = hoveredFeature === feature;
    return isHovered
      ? ElectricPoleStyleProvider.CONNECTION_STYLE_HOVER
      : ElectricPoleStyleProvider.CONNECTION_STYLE_NORMAL;
  }
}
