import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import {
  DEFAULT_CENTER,
  DEFAULT_ICON_SIZE,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  DEFAULT_PIXEL_RATIO,
  DEFAULT_ROTATION,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_ZOOM,
} from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldSelectionInteraction } from '@endfieldmap/map-core/event/selection';
import { ActiveLayer } from '@endfieldmap/map-core/render/layers/active';
import { HoverLayer } from '@endfieldmap/map-core/render/layers/hover';
import { MapLayer } from '@endfieldmap/map-core/render/layers/map';
import type { DisposeListener } from '@endfieldmap/map-core/types/event';
import type { MapConfig } from '@endfieldmap/map-core/types/map';
import { observable } from 'mobx';
import type { Collection } from 'ol';
import { Overlay, View } from 'ol';
import Control from 'ol/control/Control';
import type { Interaction } from 'ol/interaction';
import { defaults as interactionDefaults } from 'ol/interaction';
import Map from 'ol/Map';
import { Projection } from 'ol/proj';

const getPaddingPixels = (viewportWidth: number, viewportHeight: number) => ({
  top: Math.max(viewportHeight * 0.25, 400),
  right: Math.max(viewportWidth * 0.25, 400),
  bottom: Math.max(viewportHeight * 0.25, 400),
  left: Math.max(viewportWidth * 0.3, 500),
});

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
  /** Hover图层 */
  public hoverLayer: HoverLayer;
  /** Active图层 */
  public activeLayer: ActiveLayer;
  /** 是否开启调整视图 */
  @observable accessor adjustView: boolean;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 地图视图调整监听器释放函数 */
  private disposeAdjustViewListener?: DisposeListener;

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

    this.adjustView = false;

    // 创建HoverLayer实例
    this.hoverLayer = new HoverLayer();
    // 将HoverLayer添加到地图，确保在entity和electric pole图层之上
    this.map.addLayer(this.hoverLayer.layer);

    // 创建ActiveLayer实例
    this.activeLayer = new ActiveLayer();
    // 将ActiveLayer添加到地图
    this.map.addLayer(this.activeLayer.layer);

    // 监听HOVER_FEATURE_CHANGE事件
    this.registerHoverEventHandler();
    // 监听ACTIVE_FEATURE_CHANGE事件
    this.registerActiveEventHandler();
  }

  /**
   * 设置动态边界约束，根据当前缩放级别限制拖动范围
   */
  private setDynamicConstraint(): void {
    const resolution = this.view.getResolution();
    const center = this.view.getCenter();
    const size = this.map.getSize();

    if (!resolution || !center || !size) return;

    const paddingPixels = getPaddingPixels(size[0], size[1]);

    // 计算视图在当前分辨率下的半宽和半高（地图坐标）
    const viewHalfWidth = (size[0] / 2) * resolution;
    const viewHalfHeight = (size[1] / 2) * resolution;

    // 转换 padding 为地图坐标
    const paddingMap = {
      left: paddingPixels.left * resolution,
      right: paddingPixels.right * resolution,
      bottom: paddingPixels.bottom * resolution,
      top: paddingPixels.top * resolution,
    };

    const projectionExtent = this.projection.getExtent();
    const mapCenterX = (projectionExtent[0] + projectionExtent[2]) / 2;
    const mapCenterY = (projectionExtent[1] + projectionExtent[3]) / 2;

    // 计算允许的中心点范围
    let minX = projectionExtent[0] + viewHalfWidth - paddingMap.left;
    const minY = projectionExtent[1] + viewHalfHeight - paddingMap.bottom;
    let maxX = projectionExtent[2] - viewHalfWidth + paddingMap.right;
    const maxY = projectionExtent[3] - viewHalfHeight + paddingMap.top;

    // 计算偏移量，让地图内容整体偏右显示
    // 地图中心点 X 减小 = 地图内容向右移动
    const offsetX = (paddingMap.left - paddingMap.right) / 2;

    let constrainedX: number;
    let constrainedY: number;

    // 当 minX > maxX 时（视口大于地图），锁定到偏移后的中心点
    if (minX > maxX) {
      constrainedX = mapCenterX - offsetX;
    } else {
      // 将整个约束范围向左偏移（让地图内容偏右）
      minX -= offsetX;
      maxX -= offsetX;
      constrainedX = Math.max(minX, Math.min(center[0], maxX));
    }

    if (minY > maxY) {
      constrainedY = mapCenterY;
    } else {
      constrainedY = Math.max(minY, Math.min(center[1], maxY));
    }

    // 如果中心点超出范围，使用动画过渡调整回合法位置
    if (constrainedX !== center[0] || constrainedY !== center[1]) {
      this.view.animate({
        center: [constrainedX, constrainedY],
        duration: 200,
      });
    }
  }

  public setAdjustView(adjust: boolean): void {
    if (adjust) {
      this.setDynamicConstraint();
      this.disposeAdjustViewListener = mapEventEmitter.on(MAP_EVENT.MAP_MOVE_END, this.setDynamicConstraint.bind(this));
    } else {
      this.disposeAdjustViewListener?.();
      this.disposeAdjustViewListener = undefined;
    }
    this.adjustView = adjust;
  }

  /**
   * 注册hover事件处理器
   */
  private registerHoverEventHandler(): void {
    const disposeHoverChange = mapEventEmitter.on(MAP_EVENT.HOVER_FEATURE_CHANGE, (event) => {
      const { newFeature, coordinate } = event;

      if (newFeature && coordinate) {
        // 显示hover效果，使用事件中提供的坐标（对于聚合feature是聚合中心坐标）
        // 使用底部圆的实际半径（图标半径 + 描边宽度）
        const radius = DEFAULT_ICON_SIZE / 2 + DEFAULT_STROKE_WIDTH;
        this.hoverLayer.showHover(coordinate, radius);
      } else {
        // 隐藏hover效果
        this.hoverLayer.hideHover();
      }
    });

    this.disposeListeners.push(disposeHoverChange);
  }

  /**
   * 注册active事件处理器
   */
  private registerActiveEventHandler(): void {
    const disposeActiveChange = mapEventEmitter.on(MAP_EVENT.ACTIVE_FEATURE_CHANGE, (event) => {
      const { newFeature, coordinate } = event;

      if (newFeature && coordinate) {
        // 显示active效果
        const radius = DEFAULT_ICON_SIZE / 2 + DEFAULT_STROKE_WIDTH;
        this.activeLayer.showActive(coordinate, radius);
      } else {
        // 隐藏active效果
        this.activeLayer.hideActive();
      }
    });

    this.disposeListeners.push(disposeActiveChange);
  }

  /**
   * 销毁地图，清理资源
   */
  public dispose(): void {
    // 清理事件监听器
    this.disposeListeners.forEach((dispose) => dispose());
    this.disposeListeners = [];

    // 隐藏hover效果
    this.hoverLayer.hideHover();
    // 隐藏active效果
    this.activeLayer.hideActive();
    this.disposeAdjustViewListener?.();
    this.disposeAdjustViewListener = undefined;
  }
}
