import {
  AddDevToolsFeatureCommand,
  BatchRemoveDevToolsFeaturesCommand,
  ClearDevToolsFeaturesCommand,
  type DevToolsControllerInterface,
  RemoveDevToolsFeatureCommand,
  SetDevToolsFeatureVisibilityCommand,
} from '@endfieldmap/map-core/history/dev_tools_commands';
import { HistoryManager } from '@endfieldmap/map-core/history/history_manager';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { DevToolsRenderer } from '@endfieldmap/map-core/render/renderer/dev_tools_renderer';
import {
  DevToolsFeatureBaseStyleKey,
  type DevToolsFeatureData,
  DevToolsFeatureIdKey,
  DevToolsFeatureTypeKey,
  DevToolsFeatureVisibleKey,
  DevToolsFeatureZIndexKey,
  type DevToolsLayerItem,
  DevToolsShapeType,
  type DevToolsStyleConfig,
} from '@endfieldmap/map-core/types/dev_tools';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Geometry } from 'ol/geom';
import { Circle, LineString, Point, Polygon } from 'ol/geom';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

/**
 * DevTools 控制器配置
 */
export interface DevToolsControllerConfig {
  /** 历史记录最大数量 */
  maxHistory?: number;
}

/**
 * DevTools 控制器
 * 负责管理开发工具的绘制功能，包含独立的历史记录管理
 */
export class DevToolsController implements DevToolsControllerInterface {
  /** 渲染器 */
  public readonly renderer: DevToolsRenderer;

  /** 历史记录管理器（DevTools 专用） */
  public readonly historyManager: HistoryManager;

  /** ID 生成器 */
  private idCounter = 0;

  /** z-index 计数器 */
  private zIndexCounter = 0;

  /** Features 变更版本（用于触发 MobX 更新） */
  @observable
  accessor featuresRevision = 0;

  /** 图层是否已添加到地图 */
  @observable
  accessor layerAdded = false;

  constructor(config?: DevToolsControllerConfig) {
    const mapInstance = EndfieldMap.getInstance();
    this.renderer = new DevToolsRenderer();
    this.historyManager = new HistoryManager(config?.maxHistory ?? 50);

    // 添加图层到地图
    mapInstance.map.addLayer(this.renderer.layer);
    this.layerAdded = true;

    logger.debug('[DevToolsController] Initialized');
  }

  // #region 公共 API（带历史记录）

  /**
   * 绘制点
   */
  @action
  public drawPoint(coordinate: Coordinate, style: DevToolsStyleConfig): number {
    const id = this.generateId();
    const zIndex = this.generateZIndex();

    const geometry = new Point(coordinate);
    const olStyle = this.createPointStyle(style);

    const data: DevToolsFeatureData = {
      id,
      type: DevToolsShapeType.POINT,
      geometry,
      style: olStyle,
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 绘制圆形
   */
  @action
  public drawCircle(center: Coordinate, radius: number, style: DevToolsStyleConfig): number {
    const id = this.generateId();
    const zIndex = this.generateZIndex();

    const geometry = new Circle(center, radius);
    const olStyle = this.createShapeStyle(style);

    const data: DevToolsFeatureData = {
      id,
      type: DevToolsShapeType.CIRCLE,
      geometry,
      style: olStyle,
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 绘制多边形
   */
  @action
  public drawPolygon(coordinates: Coordinate[], style: DevToolsStyleConfig): number {
    const id = this.generateId();
    const zIndex = this.generateZIndex();

    // Polygon 需要闭合的坐标数组
    const closedCoords = [...coordinates];
    if (
      coordinates.length > 0 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      closedCoords.push(coordinates[0]);
    }

    const geometry = new Polygon([closedCoords]);
    const olStyle = this.createShapeStyle(style);

    const data: DevToolsFeatureData = {
      id,
      type: DevToolsShapeType.POLYGON,
      geometry,
      style: olStyle,
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 绘制线段
   */
  @action
  public drawLine(coordinates: Coordinate[], style: DevToolsStyleConfig): number {
    const id = this.generateId();
    const zIndex = this.generateZIndex();

    const geometry = new LineString(coordinates);
    const olStyle = this.createLineStyle(style);

    const data: DevToolsFeatureData = {
      id,
      type: DevToolsShapeType.LINE,
      geometry,
      style: olStyle,
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 绘制矩形
   */
  @action
  public drawRectangle(topLeft: Coordinate, bottomRight: Coordinate, style: DevToolsStyleConfig): number {
    const coordinates: Coordinate[] = [
      topLeft,
      [bottomRight[0], topLeft[1]],
      bottomRight,
      [topLeft[0], bottomRight[1]],
      topLeft,
    ];

    const id = this.generateId();
    const zIndex = this.generateZIndex();

    const geometry = new Polygon([coordinates]);
    const olStyle = this.createShapeStyle(style);

    const data: DevToolsFeatureData = {
      id,
      type: DevToolsShapeType.RECTANGLE,
      geometry,
      style: olStyle,
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 添加自定义 Feature（支持任意 OL Feature）
   */
  @action
  public addFeature(feature: Feature, type: DevToolsShapeType = DevToolsShapeType.POINT): number {
    const id = this.generateId();
    const zIndex = this.generateZIndex();

    const geometry = feature.getGeometry();
    if (!geometry) {
      logger.warn('[DevToolsController] Feature has no geometry');
      return -1;
    }

    const style = feature.getStyle();

    const data: DevToolsFeatureData = {
      id,
      type,
      geometry: geometry.clone() as Geometry,
      style: style as Style | Style[],
      zIndex,
      visible: true,
    };

    const command = new AddDevToolsFeatureCommand(this, data);
    this.historyManager.execute(command);

    return id;
  }

  /**
   * 移除 Feature
   */
  @action
  public removeFeature(id: number): boolean {
    const feature = this.renderer.getFeature(id);
    if (!feature) {
      return false;
    }

    const command = new RemoveDevToolsFeatureCommand(this, id);
    this.historyManager.execute(command);

    return true;
  }

  /**
   * 批量移除 Features
   */
  @action
  public removeFeatures(ids: number[]): number {
    const validIds = ids.filter((id) => this.renderer.getFeature(id));
    if (validIds.length === 0) {
      return 0;
    }

    const command = new BatchRemoveDevToolsFeaturesCommand(this, validIds);
    this.historyManager.execute(command);

    return validIds.length;
  }

  /**
   * 清空所有 Features
   */
  @action
  public clear(): void {
    if (this.renderer.getFeatureCount() === 0) {
      return;
    }

    const command = new ClearDevToolsFeaturesCommand(this);
    this.historyManager.execute(command);
  }

  /**
   * 撤销
   */
  @action
  public undo(): boolean {
    return this.historyManager.undo();
  }

  /**
   * 重做
   */
  @action
  public redo(): boolean {
    return this.historyManager.redo();
  }

  /**
   * 设置 Feature 可见性（带历史记录）
   */
  @action
  public setFeatureVisible(id: number, visible: boolean): boolean {
    if (!this.renderer.getFeature(id)) {
      return false;
    }
    const command = new SetDevToolsFeatureVisibilityCommand(this, id, visible);
    this.historyManager.execute(command);
    return true;
  }

  // #endregion

  // #region 内部方法（供 Command 调用）

  /**
   * 内部添加 Feature（不记录历史）
   */
  public addFeatureInternal(data: DevToolsFeatureData): void {
    this.renderer.addFeature(data);
    this.featuresRevision++;
  }

  /**
   * 内部移除 Feature（不记录历史）
   */
  public removeFeatureInternal(id: number): DevToolsFeatureData | null {
    const feature = this.renderer.getFeature(id);
    if (!feature) {
      return null;
    }

    const data: DevToolsFeatureData = {
      id: feature.get(DevToolsFeatureIdKey) as number,
      type: feature.get(DevToolsFeatureTypeKey) as DevToolsShapeType,
      geometry: (feature.getGeometry() as Geometry).clone(),
      style: (feature.get(DevToolsFeatureBaseStyleKey) as Style | Style[]) ?? (feature.getStyle() as Style | Style[]),
      zIndex: feature.get(DevToolsFeatureZIndexKey) as number,
      visible: (feature.get(DevToolsFeatureVisibleKey) as boolean) ?? true,
    };

    this.renderer.removeFeature(id);
    this.featuresRevision++;
    return data;
  }

  /**
   * 内部同步 Features（不记录历史）
   */
  public syncFeaturesInternal(features: DevToolsFeatureData[]): void {
    this.renderer.syncFeatures(features);
    this.featuresRevision++;
  }

  /**
   * 获取所有 Feature 数据
   */
  public getAllFeatureData(): DevToolsFeatureData[] {
    return this.renderer.getAllFeatureData();
  }

  public setFeatureVisibleInternal(id: number, visible: boolean): boolean {
    const ok = this.renderer.setFeatureVisible(id, visible);
    if (ok) {
      this.featuresRevision++;
    }
    return ok;
  }

  public getFeatureVisible(id: number): boolean {
    return this.renderer.getFeatureVisible(id);
  }

  // #endregion

  // #region 计算属性

  /**
   * 是否可以撤销
   */
  @computed
  get canUndo(): boolean {
    return this.historyManager.canUndo;
  }

  /**
   * 是否可以重做
   */
  @computed
  get canRedo(): boolean {
    return this.historyManager.canRedo;
  }

  /**
   * Feature 数量
   */
  @computed
  get featureCount(): number {
    void this.featuresRevision;
    return this.renderer.getFeatureCount();
  }

  @computed
  get layers(): DevToolsLayerItem[] {
    void this.featuresRevision;
    return this.renderer.getAllLayerItems();
  }

  // #endregion

  // #region 辅助方法

  /**
   * 生成唯一 ID
   */
  private generateId(): number {
    return ++this.idCounter;
  }

  /**
   * 生成 z-index
   */
  private generateZIndex(): number {
    return this.zIndexCounter++;
  }

  /**
   * 创建点样式
   */
  private createPointStyle(config: DevToolsStyleConfig): Style {
    return new Style({
      image: new CircleStyle({
        radius: config.radius ?? 5,
        fill: new Fill({ color: config.fillColor ?? '#ff0000' }),
        stroke: config.strokeColor
          ? new Stroke({
              color: config.strokeColor,
              width: config.strokeWidth ?? 1,
            })
          : undefined,
      }),
    });
  }

  /**
   * 创建形状样式（圆形、多边形、矩形）
   */
  private createShapeStyle(config: DevToolsStyleConfig): Style {
    return new Style({
      fill: new Fill({ color: config.fillColor ?? 'rgba(255, 0, 0, 0.3)' }),
      stroke: new Stroke({
        color: config.strokeColor ?? '#ff0000',
        width: config.strokeWidth ?? 2,
      }),
    });
  }

  /**
   * 创建线段样式
   */
  private createLineStyle(config: DevToolsStyleConfig): Style {
    return new Style({
      stroke: new Stroke({
        color: config.strokeColor ?? '#ff0000',
        width: config.strokeWidth ?? 2,
      }),
    });
  }

  // #endregion

  /**
   * 设置可见性
   */
  public setVisible(visible: boolean): void {
    this.renderer.setVisible(visible);
  }

  /**
   * 获取可见性
   */
  public getVisible(): boolean {
    return this.renderer.getVisible();
  }

  /**
   * 销毁控制器
   */
  @action
  public dispose(): void {
    const mapInstance = EndfieldMap.getInstance();
    if (this.layerAdded) {
      mapInstance.map.removeLayer(this.renderer.layer);
      this.layerAdded = false;
    }
    this.renderer.dispose();
    this.historyManager.clear();
    logger.debug('[DevToolsController] Disposed');
  }
}
