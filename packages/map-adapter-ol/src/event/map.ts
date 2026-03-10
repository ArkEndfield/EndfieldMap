import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapContextMenuEventDetail, OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core';
import { DEFAULT_ZOOM, MAP_EVENT } from '@endfieldmap/map-core';
import type { Map as OlMap, MapBrowserEvent, View } from 'ol';

/**
 * 地图事件管理器
 */
export class EndfieldMapEvent {
  /** 地图事件监听器 */
  public onMap: OlMap['on'];
  /** 视图事件监听器 */
  public onView: View['on'];
  /** 地图事件移除器 */
  public offMap: OlMap['un'];
  /** 视图事件移除器 */
  public offView: View['un'];
  /** 事件 */
  public event: EndfieldMapEmitter<OLMapEventPayloads>;
  /** contextmenu DOM 监听器（用于清理） */
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;
  /** auxclick（中键）DOM 监听器（用于清理） */
  private auxClickHandler: ((e: MouseEvent) => void) | null = null;
  /** contextmenu 所在的 viewport 元素 */
  private viewport: HTMLElement | null = null;

  constructor(mapInstance: EndfieldMap, emitter: EndfieldMapEmitter<OLMapEventPayloads>) {
    const map = mapInstance.map;
    const view = mapInstance.view;
    this.onMap = map.on.bind(map);
    this.onView = view.on.bind(view);
    this.offMap = map.un.bind(map);
    this.offView = view.un.bind(view);
    this.event = emitter;
    this.initEmitter(mapInstance);
  }

  /**
   * 清理 DOM 事件监听器
   */
  public dispose(): void {
    if (this.viewport) {
      if (this.contextMenuHandler) {
        this.viewport.removeEventListener('contextmenu', this.contextMenuHandler);
        this.contextMenuHandler = null;
      }
      if (this.auxClickHandler) {
        this.viewport.removeEventListener('auxclick', this.auxClickHandler);
        this.auxClickHandler = null;
      }
      this.viewport = null;
    }
  }

  private initEmitter(mapInstance: EndfieldMap) {
    const map = mapInstance.map;
    const view = mapInstance.view;
    this.onView('change:resolution', () => {
      this.event.fire(MAP_EVENT.ZOOM_CHANGE, view.getZoom() ?? DEFAULT_ZOOM);
    });

    this.onMap('click', (event) => {
      this.event.fire(MAP_EVENT.MAP_CLICK, event);
    });

    (this.onMap as (type: string, listener: (e: MapBrowserEvent<PointerEvent>) => void) => void)(
      'pointerdown',
      (event) => {
        this.event.fire(MAP_EVENT.MAP_POINTERDOWN, event);
      }
    );

    // hover 实体（包含普通实体和电线杆），只转发浏览器事件，命中逻辑复用点击的控制器逻辑
    this.onMap('pointermove', (event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>) => {
      // 拖拽过程中不处理 pointermove 以避免 hover 逻辑干扰拖拽（包括平移和框选）
      if (event.dragging) {
        return;
      }
      this.event.fire(MAP_EVENT.MAP_HOVER, { event });
    });

    this.onMap('moveend', (e) => {
      this.event.fire(MAP_EVENT.MAP_MOVE_END, e);
    });

    this.onView('change:center', () => {
      this.event.fire(MAP_EVENT.MAP_CENTER_CHANGE, view.getCenter());
    });

    this.viewport = map.getViewport();

    // 右键菜单事件
    this.contextMenuHandler = (domEvent: MouseEvent) => {
      domEvent.preventDefault();
      const pixel = map.getEventPixel(domEvent) as [number, number];
      const coordinate = map.getCoordinateFromPixel(pixel);
      const detail: OLMapContextMenuEventDetail = {
        pixel,
        coordinate: coordinate ?? undefined,
        originalEvent: domEvent,
        map,
      };
      this.event.fire(MAP_EVENT.MAP_CONTEXT_MENU, detail);
    };
    this.viewport.addEventListener('contextmenu', this.contextMenuHandler);

    // 中键点击事件
    this.auxClickHandler = (domEvent: MouseEvent) => {
      // auxclick 包含中键(1)和其他按键，只处理中键
      if (domEvent.button !== 1) return;
      domEvent.preventDefault();
      const pixel = map.getEventPixel(domEvent) as [number, number];
      const coordinate = map.getCoordinateFromPixel(pixel);
      const detail: OLMapContextMenuEventDetail = {
        pixel,
        coordinate: coordinate ?? undefined,
        originalEvent: domEvent,
        map,
      };
      this.event.fire(MAP_EVENT.MAP_MIDDLE_CLICK, detail);
    };
    this.viewport.addEventListener('auxclick', this.auxClickHandler);
  }
}
