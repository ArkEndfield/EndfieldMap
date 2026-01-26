import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import {
  DEFAULT_CENTER,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  DEFAULT_ROTATION,
  DEFAULT_ZOOM,
} from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldSelectionInteraction } from '@endfieldmap/map-core/event/selection';
import type { DisposeListener } from '@endfieldmap/map-core/types/event';
import type { MapConfig } from '@endfieldmap/map-core/types/map';
import { observable } from 'mobx';
import { Overlay, View } from 'ol';
import Control from 'ol/control/Control';
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
  public static interactions = interactionDefaults({
    altShiftDragRotate: false,
    pinchRotate: false,
  });
  /** 投影 */
  public static projection = new Projection({
    code: 'SIMPLE',
    units: 'pixels',
    extent: [0, 0, 256, 256],
  });
  /** 控制 */
  public control: Control;
  /** 覆盖层 */
  public overlay: Overlay;
  /** 选择 */
  public selection: EndfieldSelectionInteraction;
  /** 是否开启调整视图 */
  @observable accessor adjustView: boolean;
  /** 地图视图调整监听器释放函数 */
  private disposeAdjustViewListener?: DisposeListener;

  public static instance: EndfieldMap;

  constructor(config: MapConfig) {
    this.config = config;
    this.control = new Control({
      element: this.config.controlElement,
    });
    this.overlay = new Overlay({
      element: this.config.overlayElement,
    });
    this.view = new View({
      projection: EndfieldMap.projection,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: DEFAULT_MAX_ZOOM,
      minZoom: DEFAULT_MIN_ZOOM,
      rotation: DEFAULT_ROTATION,
      enableRotation: false,
    });
    this.map = new Map({
      target: this.config.container,
      view: this.view,
      interactions: EndfieldMap.interactions,
      controls: [this.control],
      overlays: [this.overlay],
    });
    this.selection = new EndfieldSelectionInteraction();
    EndfieldMap.interactions.push(this.selection.select);
    EndfieldMap.interactions.push(this.selection.dragBox);

    this.adjustView = false;

    EndfieldMap.instance = this;
  }

  public static getInstance() {
    if (!this.instance) {
      throw new Error('EndfieldMap instance not initialized');
    }
    return this.instance;
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

    const projectionExtent = EndfieldMap.projection.getExtent();
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
   * 销毁地图，清理资源
   */
  public dispose(): void {
    this.disposeAdjustViewListener?.();
    this.disposeAdjustViewListener = undefined;
  }
}
