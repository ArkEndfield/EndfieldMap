import type { StoredRoute } from '@endfieldmap/map-service/@types/route';
import { BaseUserDataService, type BaseUserDataServiceConfig } from '@endfieldmap/map-service/service/user/data/_base';
import { logger } from '@endfieldmap/tools';

export type RouteDataCallback = (routeId: string) => void;

/**
 * 路线本地数据服务（浏览器 RxDB `route` collection）。
 *
 * 仅做本地持久化，不参与云端同步、不落本站服务端：森空岛导入的路线按需求只在
 * 浏览器暂存。发布到森空岛是单向动作，由 map 层的 RouteDataService 负责。
 */
export class RouteUserDataService<T, R> extends BaseUserDataService<RouteDataCallback, T, R> {
  protected callbacks: RouteDataCallback[] = [];

  constructor(config: BaseUserDataServiceConfig<T, R>) {
    super(config);
  }

  private get db() {
    return this.databaseService.database.route;
  }

  public getAll(): Promise<StoredRoute[]> {
    return this.db.find().exec().then((docs) => docs.map((doc) => doc.toJSON() as StoredRoute));
  }

  public async getById(id: string): Promise<StoredRoute | null> {
    const doc = await this.db.findOne({ selector: { id } }).exec();
    return doc ? (doc.toJSON() as StoredRoute) : null;
  }

  /**
   * 写入前剥掉值为 undefined 的可选字段（color / sklandRouteId 等）。
   * JSON 语义里 undefined 本就不该存在，且显式 undefined 会让 dev 模式的
   * AJV 校验按 string 类型失败，这里统一收敛成「字段缺省」。
   */
  private toDoc(route: StoredRoute): StoredRoute {
    const doc: StoredRoute = {
      id: route.id,
      name: route.name,
      source: route.source,
      segments: route.segments.map((seg) => ({
        mapId: seg.mapId,
        ...(seg.color !== undefined ? { color: seg.color } : {}),
        points: seg.points.map((p) => ({
          x: p.x,
          y: p.y,
          z: p.z,
          ...(p.levelLogicId !== undefined ? { levelLogicId: p.levelLogicId } : {}),
        })),
      })),
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };
    if (route.description !== undefined) doc.description = route.description;
    if (route.sourceRouteId !== undefined) doc.sourceRouteId = route.sourceRouteId;
    if (route.sklandRouteId !== undefined) doc.sklandRouteId = route.sklandRouteId;
    if (route.author !== undefined) doc.author = route.author;
    return doc;
  }

  public upsert(route: StoredRoute) {
    return this.db.upsert(this.toDoc(route));
  }

  public async remove(id: string) {
    const doc = await this.db.findOne({ selector: { id } }).exec();
    return doc?.remove();
  }

  public addSubscribe(callback: RouteDataCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();
    const sub = this.db.$.subscribe((changeEvent) => {
      const routeId = (changeEvent.documentData as { id?: string })?.id;
      if (!routeId) return;
      for (const callback of this.callbacks) {
        try {
          callback(routeId);
        } catch (e) {
          logger.error('[RouteUserDataService] Callback error', e);
        }
      }
    });
    this.subscriptions.push(sub);
  }

  public clearAllData() {
    return this.db.find().remove();
  }
}
