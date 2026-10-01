import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { RouteRender } from '@endfieldmap/map-adapter-ol/render/renderer/entity/route/index';
import type { RouteLineData } from '@endfieldmap/map-adapter-ol/render/renderer/entity/route/route_renderer';
import type { IRouteController, MapData, MapDataManager, RouteRenderItem } from '@endfieldmap/map-core';
import { Disposer } from '@endfieldmap/map-core';
import { reaction } from 'mobx';

export interface RouteControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
}

/**
 * 路线控制器：把路线领域数据换算成地图坐标并交给渲染器。
 *
 * 路线不参与实体系统的搜索/hover/active，因此这里只做「数据 -> 折线」的
 * 转换与图层生命周期管理。坐标换算复用 MapDataManager.xyz2crd（与标点同系）。
 */
export class RouteController extends Disposer implements IRouteController {
  public readonly render: RouteRender;

  private mapDataManager: MapDataManager;
  private routes: RouteRenderItem[] = [];
  private visible = true;

  constructor(config: RouteControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.render = new RouteRender({
      mapInstance: config.mapInstance,
      mapIds: config.mapDataManager.mapIds,
    });

    const disposer = reaction(
      () => this.mapDataManager.currentMapId,
      (mapId) => this.render.switchMap(mapId),
      { fireImmediately: true }
    );
    this.disposers.push(disposer);
  }

  /** 全量替换路线集合，重建折线。 */
  public setRoutes(routes: RouteRenderItem[]): void {
    this.routes = routes ?? [];
    this.render.setLinesByMap(this.buildLinesByMap());
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.render.setVisible(visible);
  }

  public getVisible(): boolean {
    return this.visible;
  }

  public override dispose(): void {
    super.dispose();
    this.render.dispose();
  }

  /**
   * 把路线按地图分组、把世界坐标 p(x,y,z) 换算为地图坐标 [x', y']。
   * 同一条路线的多段共享 routeId，用段序号区分折线。
   */
  private buildLinesByMap(): Map<MapData['id'], RouteLineData[]> {
    const byMap = new Map<MapData['id'], RouteLineData[]>();
    for (const route of this.routes) {
      route.segments.forEach((segment, segIndex) => {
        const mapId = segment.mapId as MapData['id'];
        // 空段跳过；单点段保留——草稿只描了第一个点时，渲染器画起点圆点给反馈
        if (segment.points.length < 1) return;

        const coordinates = segment.points.map((p) => {
          const crd = this.mapDataManager.xyz2crd({ x: p.x, y: p.y, z: p.z }, mapId);
          return [crd[0], crd[1]] as [number, number];
        });

        const list = byMap.get(mapId) ?? [];
        list.push({
          id: `${route.id}#${segIndex}`,
          coordinates,
          color: segment.color,
          draft: route.draft,
        });
        byMap.set(mapId, list);
      });
    }
    return byMap;
  }
}
