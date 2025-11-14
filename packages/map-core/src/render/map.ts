import { DEFAULT_CENTER, DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM, DEFAULT_PIXEL_RATIO, DEFAULT_ROTATION,DEFAULT_ZOOM } from '@endfieldmap/map-core/const/map';
import { EndfieldSelectionInteraction } from '@endfieldmap/map-core/event/selection';
import { MapLayer } from '@endfieldmap/map-core/render/layers/map';
import type { MapConfig } from '@endfieldmap/map-core/types/map';
import type { Collection } from 'ol';
import { Overlay, View } from 'ol';
import Control from 'ol/control/Control';
import type { Interaction } from 'ol/interaction';
import { defaults as interactionDefaults } from 'ol/interaction';
import Map from 'ol/Map';
import { Projection } from 'ol/proj';

export class EndfieldMap {
  /** 配置 */
  public config: MapConfig;
  /** 地图实例 */
  public map: Map;
  /** 视图 */
  public view: View;
  /** 交互 */
  public interactions: Collection<Interaction>;
  /** 投影 */
  public projection: Projection;
  /** 控制 */
  public control: Control;
  /** 覆盖层 */
  public overlay: Overlay;
  /** 选择 */
  public selection: EndfieldSelectionInteraction;
  /** 地图图层 */
  public mapLayer: MapLayer;

  constructor(config: MapConfig) {
    this.config = {
      ...config,
      minZoom: config.minZoom ?? DEFAULT_MIN_ZOOM,
      maxZoom: config.maxZoom ?? DEFAULT_MAX_ZOOM,
      pixelRatio: config.pixelRatio ?? DEFAULT_PIXEL_RATIO,
    };
    this.control = new Control({
      element: this.config.controlElement,
    });
    this.overlay = new Overlay({
      element: this.config.overlayElement,
    });
    this.interactions = interactionDefaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    });
    this.projection = new Projection({
      code: 'SIMPLE',
      units: 'pixels',
      extent: [0, 0, 256, 256],
    });
    this.view = new View({
      projection: this.projection,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: this.config.maxZoom,
      minZoom: this.config.minZoom,
      rotation: DEFAULT_ROTATION,
      enableRotation: false,
    });
    this.map = new Map({
      target: this.config.container,
      view: this.view,
      interactions: this.interactions,
      controls: [this.control],
      overlays: [this.overlay],
    });
    this.mapLayer = new MapLayer({
      tileUrl: this.config.mapImageUrl,
      projection: this.projection,
    });
    // this.map.addInteraction(this.selection.select);
    // this.map.addInteraction(this.selection.dragBox);
    this.selection = new EndfieldSelectionInteraction(this.map);
    this.interactions.push(this.selection.select);
    this.interactions.push(this.selection.dragBox);
  }
}
