import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';
import { FeatureType, FeatureTypeKey, LayerType, LayerTypeKey } from '@endfieldmap/map-core';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/** 一条要绘制的路线折线（坐标已换算到地图坐标系）。 */
export interface RouteLineData {
  /** 唯一 key：同一路线在同一地图的多段用 `routeId#segIndex`。 */
  id: string;
  coordinates: Coordinate[];
  /** 折线颜色；缺省用默认色。 */
  color?: string;
  /** 草稿路线用虚线区分。 */
  draft?: boolean;
}

/** 折线默认颜色。 */
const DEFAULT_ROUTE_COLOR = '#01ffa2';

/**
 * 单张地图的路线渲染器。
 *
 * 只负责把坐标数组画成折线，不持有数据管理器、不含 MobX 监听；数据由
 * RouteController 显式传入。与电线杆连线渲染器同构，但支持每条线独立颜色。
 */
export class RouteRenderer {
  public readonly layer: VectorLayer;

  private readonly source: VectorSource;
  private featureMap: Map<string, Feature> = new Map();

  constructor(config?: { initialVisible?: boolean }) {
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: this.styleFunction.bind(this),
      visible: config?.initialVisible ?? true,
      zIndex: Z_INDEX.ROUTE_LINE,
      // 折线较细，放大点的渲染缓冲以减少裁剪接缝
      renderBuffer: 100,
    });
    this.layer.set(LayerTypeKey, LayerType.ROUTE);
  }

  /** 全量替换本图的折线。 */
  public setLines(lines: RouteLineData[]): void {
    this.source.clear();
    this.featureMap.clear();
    for (const line of lines) {
      // 单点段（草稿刚描第一个点）：画起点圆点，避免「点了却什么都没发生」
      if (line.coordinates.length === 1) {
        const feature = new Feature(new Point(line.coordinates[0]));
        feature.set(FeatureTypeKey, FeatureType.CONNECTION);
        feature.set('routeId', line.id);
        feature.set('routeColor', line.color ?? DEFAULT_ROUTE_COLOR);
        feature.set('routeDraft', line.draft ? 1 : 0);
        this.featureMap.set(line.id, feature);
        this.source.addFeature(feature);
        continue;
      }
      if (line.coordinates.length < 2) continue;
      const feature = new Feature();
      feature.setGeometry(new LineString(line.coordinates.map((c) => [c[0], c[1]])));
      feature.set(FeatureTypeKey, FeatureType.CONNECTION);
      feature.set('routeId', line.id);
      feature.set('routeColor', line.color ?? DEFAULT_ROUTE_COLOR);
      feature.set('routeDraft', line.draft ? 1 : 0);
      this.featureMap.set(line.id, feature);
      this.source.addFeature(feature);
    }
    this.source.changed();
  }

  public setVisible(visible: boolean): void {
    this.layer.setVisible(visible);
  }

  public get visible(): boolean {
    return this.layer.getVisible();
  }

  public dispose(): void {
    this.featureMap.clear();
    this.source.clear();
    this.layer.dispose();
  }

  private styleFunction(feature: FeatureLike): Style {
    const color = (feature.get('routeColor') as string) ?? DEFAULT_ROUTE_COLOR;
    const draft = feature.get('routeDraft') === 1;
    if (feature.getGeometry() instanceof Point) {
      return new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: 'rgba(255,255,255,0.9)', width: 2 }),
        }),
      });
    }
    return new Style({
      stroke: new Stroke({
        color,
        width: 2,
        lineDash: draft ? [6, 6] : undefined,
      }),
    });
  }
}
