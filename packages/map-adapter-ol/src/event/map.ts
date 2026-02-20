import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapContextMenuEventDetail, OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core';
import { DEFAULT_ZOOM,MAP_EVENT } from '@endfieldmap/map-core';
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

  private initEmitter(mapInstance: EndfieldMap) {
    const map = mapInstance.map;
    const view = mapInstance.view;
    this.onView('change:resolution', () => {
      this.event.fire(MAP_EVENT.ZOOM_CHANGE, view.getZoom() ?? DEFAULT_ZOOM);
    });

    this.onMap('click', (event) => {
      this.event.fire(MAP_EVENT.MAP_CLICK, event);
    });

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

    const viewport = map.getViewport();
    viewport.addEventListener('contextmenu', (domEvent: MouseEvent) => {
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
    });
  }
}
