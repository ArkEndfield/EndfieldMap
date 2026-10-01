import type { RouteRenderItem } from '@endfieldmap/map-core';
import { MAP_EVENT } from '@endfieldmap/map-core';
import type {
  SklandRouteDetailResponse,
  SklandRoutePushResponse,
  StoredRoute,
  StoredRoutePoint,
  StoredRouteSegment,
} from '@endfieldmap/map-service/@types/route';
import type { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import {
  appendDraftPoint,
  sklandAggToStoredRoute,
  storedRouteToPushSegments,
  undoLastDraftPoint,
} from '@endfieldmap/map-service/service/data/map/route_transform';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import type { SklandRouteService } from '@endfieldmap/map-service/service/skland_route';
import type { RouteUserDataService } from '@endfieldmap/map-service/service/user/data/route';
import { action, computed, observable, runInAction } from 'mobx';

export interface RouteDataServiceDeps<T, R> {
  adapterRegistry: AdapterRegistry;
  i18nService: I18nService;
  routeUserDataService: RouteUserDataService<T, R>;
  sklandRouteService: SklandRouteService;
}

/**
 * 璺嚎鏁版嵁鏈嶅姟锛坢ap 灞傦級銆? *
 * 涓夋潯鏁版嵁璺緞鍒嗗紑锛? * - 鑷缓锛氬湴鍥句笂鎸夐『搴忕偣閫夊疄浣撴敹闆嗙偣浣嶏紝淇濆瓨涓?source='local' 鐨勬湰鍦拌矾绾匡紱
 * - 瀵煎叆锛氱敤鎴锋墜鍔ㄩ€夋嫨妫┖宀涜矾绾匡紝浠ｇ悊鎷夊彇鍚庤浆鎹㈡垚 StoredRoute 瀛樻湰鍦? *   锛坰ource='skland'锛夆€斺€斿彧姝や竴鏉¤矾寰勪細鎺ヨЕ涓婃父鏁版嵁锛屼笖鐢辩敤鎴锋樉寮忚Е鍙戯紱
 * - 鍙戝竷锛氭妸鏈湴璺嚎杞垚 levelLogicId 鍒楄〃鍗曞悜鎺ㄩ€佸埌妫┖宀涖€? *
 * 浠讳綍璺緞閮戒笉浼氭妸妫┖宀涙暟鎹啓鍏ユ湰绔欐湇鍔＄銆? */
export class RouteDataService<T, R> {
  @observable.ref accessor routes: StoredRoute[] = [];
  @observable accessor visible: boolean = true;
  /** 鏄惁澶勪簬缁樺埗妯″紡锛堢偣鍑诲疄浣撴敹闆嗙偣浣嶏級銆?*/
  @observable accessor isPicking: boolean = false;
  @observable.ref accessor draftSegments: StoredRouteSegment[] = [];
  @observable accessor loading: boolean = false;

  private readonly deps: RouteDataServiceDeps<T, R>;
  private eventListenerDisposers: Array<() => void> = [];

  constructor(deps: RouteDataServiceDeps<T, R>) {
    this.deps = deps;
  }

  @computed
  public get draftPointCount(): number {
    return this.draftSegments.reduce((sum, seg) => sum + seg.points.length, 0);
  }

  @computed
  public get isInRouteOperateMode(): boolean {
    return this.isPicking;
  }

  public async init(): Promise<void> {
    this.initEntityClickEvent();
    this.deps.routeUserDataService.addSubscribe(() => {
      void this.reload();
    });
    await this.reload();
  }

  private get translate() {
    return this.deps.i18nService.translate;
  }

  private get routeController() {
    return this.deps.adapterRegistry.hasAdapter ? this.deps.adapterRegistry.adapter.routeController : undefined;
  }

  /** 浠庢湰鍦板簱閲嶆柊璇诲彇骞跺簲鐢ㄥ埌娓叉煋銆?*/
  public async reload(): Promise<void> {
    const routes = await this.deps.routeUserDataService.getAll();
    runInAction(() => {
      this.routes = routes;
    });
    this.applyToAdapter();
  }

  /** 娓叉煋鍙鎬у紑鍏炽€?*/
  @action
  public changeVisibility(visible: boolean): void {
    this.visible = visible;
    this.routeController?.setVisible(visible);
  }

  @action
  public toggleVisibility(): void {
    this.changeVisibility(!this.visible);
  }

  /** 鎶婃墍鏈夋湰鍦拌矾绾夸氦缁欓€傞厤鍣ㄦ覆鏌撱€?*/
  private applyToAdapter(): void {
    const controller = this.routeController;
    if (!controller) return;
    // StoredRouteSegment 涓?RouteSegmentData 缁撴瀯涓€鑷达紝鐩存帴閫忎紶
    const items: RouteRenderItem[] = [
      ...this.routes.map((route) => ({ id: route.id, segments: route.segments })),
      { id: '__route_draft__', draft: true, segments: this.draftSegments },
    ];
    controller.setRoutes(items);
    controller.setVisible(this.visible);
  }

  // #region 鑷缓璺嚎

  @action
  public startPicking(): void {
    this.isPicking = true;
    this.draftSegments = [];
    this.applyToAdapter();
  }

  @action
  public cancelPicking(): void {
    this.isPicking = false;
    this.draftSegments = [];
    this.applyToAdapter();
  }

  /** 鎾ら攢鏈€鍚庝竴娆＄偣浣嶏紙鍙法娈靛洖閫€锛夈€?*/
  @action
  public undoLastPoint(): void {
    this.draftSegments = undoLastDraftPoint(this.draftSegments);
    this.applyToAdapter();
  }

  /** 鎶婅崏绋夸繚瀛樻垚涓€鏉℃湰鍦拌矾绾裤€俷ame 涓虹┖鍒欏洖閫€涓恒€屾湭鍛藉悕璺嚎銆嶃€?*/
  public async saveDraft(name: string, description = ''): Promise<StoredRoute | null> {
    const segments: StoredRouteSegment[] = this.draftSegments
      .filter((seg) => seg.points.length > 0)
      .map((seg) => ({ mapId: seg.mapId, color: seg.color, points: seg.points }));
    if (segments.length === 0) {
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, { content: this.translate('error:route.empty') });
      return null;
    }

    const now = Date.now();
    const route: StoredRoute = {
      id: `route_${now}_${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim() || this.translate('sidebar:operation.route.untitled'),
      description,
      source: 'local',
      segments,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.routeUserDataService.upsert(route);
    this.cancelPicking();
    await this.reload();
    return route;
  }

  /**
   * 鐩存帴鐢ㄤ竴缁勬湁搴忕偣浣嶅瓨鎴愭湰鍦拌矾绾匡紙涓嶇粡杩囨墜鍔ㄦ弿鐐圭殑 draft 娴佺▼锛夈€?   *
   * 渚?AI 鍔╂墜鐨勮矾寰勮鍒掔瓑銆屼竴娆℃€х畻鍑烘暣鏉¤矾绾裤€嶇殑鍦烘櫙浣跨敤锛屽啓鍏ュ悗鐓у父
   * reload + 娓叉煋锛屼笌鑷缓璺嚎娌℃湁鍖哄埆銆?   */
  public async saveRouteFromPoints(
    name: string,
    mapId: string,
    points: StoredRoutePoint[],
    description = ''
  ): Promise<StoredRoute | null> {
    if (points.length === 0) {
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, { content: this.translate('error:route.empty') });
      return null;
    }

    const now = Date.now();
    const route: StoredRoute = {
      id: `route_${now}_${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim() || this.translate('sidebar:operation.route.untitled'),
      description,
      source: 'local',
      segments: [{ mapId, points }],
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.routeUserDataService.upsert(route);
    await this.reload();
    return route;
  }

  public async renameRoute(id: string, name: string): Promise<void> {
    const route = await this.deps.routeUserDataService.getById(id);
    if (!route) return;
    await this.deps.routeUserDataService.upsert({ ...route, name: name.trim() || route.name, updatedAt: Date.now() });
    await this.reload();
  }

  public async deleteRoute(id: string): Promise<void> {
    await this.deps.routeUserDataService.remove(id);
    await this.reload();
  }

  private initEntityClickEvent(): void {
    if (!this.deps.adapterRegistry.hasAdapter) return;
    const dispose = this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isPicking) return;
      const instance = event.instance;
      const pos = instance.position;
      runInAction(() => {
        this.draftSegments = appendDraftPoint(this.draftSegments, instance.mapId, {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          levelLogicId: instance.id,
        });
      });
      this.applyToAdapter();
    });
    this.eventListenerDisposers.push(dispose);
  }

  // #endregion

  // #region 妫┖宀涘崟鍚戜簰鍔?
  /**
   * 鎵嬪姩瀵煎叆涓€鏉℃．绌哄矝璺嚎鍒版湰鍦版祻瑙堝櫒銆?   *
   * 鐢辩敤鎴峰湪閫夋嫨鐣岄潰涓婃樉寮忚Е鍙戯紱鍙鍙栬繖涓€娆★紝涓嶅仛浠讳綍鍚庡彴鎶撳彇鎴栬惤搴?   * 鍒版湰绔欐湇鍔＄銆傜偣浣嶆棤娉曞弽鏌ユ湰鍦?levelLogicId锛坢d5 鍗曞悜锛夛紝鏁呬粎淇濈暀鍧愭爣銆?   */
  public async importFromSkland(routeId: string, roleId?: string): Promise<StoredRoute> {
    const detail: SklandRouteDetailResponse = await this.deps.sklandRouteService.fetchRouteDetail(routeId, { roleId });
    const agg = detail.routeAgg;
    if (!agg) {
      throw new Error(this.translate('error:route.import_failed'));
    }
    const now = Date.now();
    const route = sklandAggToStoredRoute(agg, now, this.translate('sidebar:operation.route.untitled'));
    await this.deps.routeUserDataService.upsert(route);
    await this.reload();
    return route;
  }

  /**
   * 鎶婃湰鍦拌矾绾垮崟鍚戝彂甯冨埌妫┖宀涖€?   *
   * 鍙湁甯?levelLogicId 鐨勭偣鍙彂甯冿紙妫┖宀涗互 md5(levelLogicId) 瀹氫綅鐐逛綅锛夛紱
   * 瀵煎叆鐨勮矾绾夸笉鍚?levelLogicId锛岃嫢瑕佸彂甯冮渶瑕佸湪鏈珯閲嶆柊鎻忕偣銆?   */
  public async pushToSkland(routeId: string, roleId?: string): Promise<SklandRoutePushResponse> {
    const route = await this.deps.routeUserDataService.getById(routeId);
    if (!route) {
      throw new Error(this.translate('error:route.not_found'));
    }
    const segments = storedRouteToPushSegments(route);
    if (segments.length === 0) {
      throw new Error(this.translate('error:route.no_publishable_points'));
    }

    const result = await this.deps.sklandRouteService.pushRoute({
      roleId,
      routeId: route.sklandRouteId,
      title: route.name,
      description: route.description,
      segments,
    });
    if (result?.routeId) {
      await this.deps.routeUserDataService.upsert({ ...route, sklandRouteId: result.routeId, updatedAt: Date.now() });
      await this.reload();
    }
    return result;
  }

  /** 鍒犻櫎宸插彂甯冨埌妫┖宀涚殑璺嚎銆?*/
  public async deleteOnSkland(routeId: string, sklandRouteId: string, roleId?: string): Promise<void> {
    await this.deps.sklandRouteService.deleteRoute(sklandRouteId, roleId);
    const route = await this.deps.routeUserDataService.getById(routeId);
    if (route) {
      await this.deps.routeUserDataService.upsert({ ...route, sklandRouteId: undefined, updatedAt: Date.now() });
      await this.reload();
    }
  }

  // #endregion

  @action
  public stopAllOperation(): void {
    this.isPicking = false;
    this.draftSegments = [];
    this.applyToAdapter();
  }

  public dispose(): void {
    this.eventListenerDisposers.forEach((dispose) => dispose());
    this.eventListenerDisposers = [];
  }
}
