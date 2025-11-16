import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { DEFAULT_ZOOM } from '@endfieldmap/map-core/const/map';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { MapContextMenuEventDetail } from '@endfieldmap/map-core/types/event';
import type { Map as OlMap, View } from 'ol';

/**
 * 地图事件管理器
 */
export class EndfieldMapEvent {
  /** 地图实例 */
  public map: OlMap;
  /** 视图实例 */
  public view: View;
  /** 地图事件监听器 */
  public onMap: OlMap['on'];
  /** 视图事件监听器 */
  public onView: View['on'];
  /** 地图事件移除器 */
  public offMap: OlMap['un'];
  /** 视图事件移除器 */
  public offView: View['un'];
  /** 事件 */
  public event: EndfieldMapEmitter;

  constructor(map: OlMap, view: View) {
    this.map = map;
    this.view = view;
    this.onMap = this.map.on.bind(this.map);
    this.onView = this.view.on.bind(this.view);
    this.offMap = this.map.un.bind(this.map);
    this.offView = this.view.un.bind(this.view);
    this.event = mapEventEmitter;
    this.initEmitter();
  }

  private initEmitter() {
    this.onView('change:resolution', () => {
      this.event.fire(MAP_EVENT.ZOOM_CHANGE, this.view.getZoom() ?? DEFAULT_ZOOM);
    });

    this.onMap('click', (event) => {
      this.event.fire(MAP_EVENT.MAP_CLICK, event);
    });

    this.onView('change:center', () => {
      this.event.fire(MAP_EVENT.MAP_CENTER_CHANGE, this.view.getCenter());
    });

    const viewport = this.map.getViewport();
    viewport.addEventListener('contextmenu', (domEvent: MouseEvent) => {
      domEvent.preventDefault();
      const pixel = this.map.getEventPixel(domEvent) as [number, number];
      const coordinate = this.map.getCoordinateFromPixel(pixel);
      const detail: MapContextMenuEventDetail = {
        pixel,
        coordinate: coordinate ?? undefined,
        originalEvent: domEvent,
        map: this.map,
      };
      this.event.fire(MAP_EVENT.MAP_CONTEXT_MENU, detail);
    });
  }
}
