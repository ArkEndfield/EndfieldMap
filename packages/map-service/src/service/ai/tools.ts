import type { EntityDataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey, NoteKey } from '@endfieldmap/map-core';
import type { AiTool, AiToolResult } from '@endfieldmap/map-service/@types/ai';
import type { StoredRoutePoint } from '@endfieldmap/map-service/@types/route';
import type { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import { planCollectionRoute } from '@endfieldmap/map-service/service/ai/path';
import type { MapDataService } from '@endfieldmap/map-service/service/data/map';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import type { LangHashService } from '@endfieldmap/map-service/service/lang_hash';

export interface AiToolContext<T, R> {
  adapterRegistry: AdapterRegistry;
  mapDataService: MapDataService<T, R>;
  i18nService: I18nService;
  langHashService: LangHashService;
}

/** 单次查询回给模型的点位上限，超出会截断并在结果里说明。 */
const DEFAULT_QUERY_LIMIT = 40;
const MAX_QUERY_LIMIT = 200;
/** 一次可规划的点位上限，再多模型也读不完，且 2-opt 会明显变慢。 */
const MAX_ROUTE_POINTS = 300;

interface PointBrief {
  id: number;
  name: string;
  groupKey: string;
  category: string;
  mapId: string;
  mapLevelId?: string;
  x: number;
  z: number;
  marked: boolean;
  /** 到参考点的水平距离，仅在按距离筛选/排序时返回 */
  distance?: number;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'number' ? item : typeof item === 'string' ? Number(item) : NaN))
    .filter((item) => Number.isFinite(item));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 工具执行摘要（面板上折叠成一行给用户看的那句）。 */
type ToolSummaryKey =
  | 'map_context'
  | 'groups'
  | 'query'
  | 'focus'
  | 'focus_failed'
  | 'mark'
  | 'unmark'
  | 'highlight'
  | 'unhighlight'
  | 'route'
  | 'route_saved'
  | 'route_empty';

/**
 * 摘要的中文兜底，同时充当插值变量的说明。
 *
 * 计数变量一律叫 `num` 而不是 `count`：`count` 是 i18next 的复数保留字，
 * 传了就会去找 `key_one` / `key_other`，而这些 key 并不存在。
 */
const TOOL_SUMMARY_FALLBACK: Record<ToolSummaryKey, string> = {
  map_context: '当前地图 {{mapId}}',
  groups: '{{mapId}} 共 {{num}} 个点位分组',
  query: '命中 {{total}} 个点位，返回 {{returned}} 个',
  focus: '已定位到点位 {{id}}',
  focus_failed: '未找到点位 {{id}}',
  mark: '已标记 {{num}} 个点位',
  unmark: '已取消标记 {{num}} 个点位',
  highlight: '已高亮 {{num}} 个点位',
  unhighlight: '已取消高亮 {{num}} 个点位',
  route: '已规划 {{num}} 个点位，总路程约 {{distance}}',
  route_saved: '已规划 {{num}} 个点位，总路程约 {{distance}}，已保存为路线',
  route_empty: '没有可规划的点位',
};

/**
 * AI 工具集。每个工具都是对既有服务的薄封装：查询走 entityController 的内存数据，
 * 标记/定位/存路线都复用用户手动操作时的同一条链路，因此撤销、同步、渲染刷新
 * 全都自动生效，不需要 AI 侧另开写入口。
 */
export class AiToolset<T, R> {
  private readonly ctx: AiToolContext<T, R>;
  /** entityDataIdKey -> 显示名，切换语言时整体作废 */
  private readonly nameCache = new Map<string, string>();
  private nameCacheLocale: string | null = null;

  constructor(ctx: AiToolContext<T, R>) {
    this.ctx = ctx;
  }

  // #region 基础访问

  private get adapter() {
    return this.ctx.adapterRegistry.hasAdapter ? this.ctx.adapterRegistry.adapter : undefined;
  }

  private get currentMapId(): string {
    return this.adapter?.mapController.dataManager.currentMapId ?? '';
  }

  private resolveMapId(raw: unknown): string {
    const requested = asString(raw);
    if (!requested) return this.currentMapId;
    const known = this.adapter?.mapController.dataManager.mapIds ?? [];
    return known.includes(requested) ? requested : this.currentMapId;
  }

  private translate(key: string, fallback: string): string {
    return this.ctx.i18nService.translate(key, { defaultValue: fallback });
  }

  /** 工具摘要走 i18n，缺 key 时回落到中文兜底。 */
  private summary(key: ToolSummaryKey, values?: Record<string, string | number>): string {
    return this.ctx.i18nService.translate(`settings:ai.tool.${key}`, {
      defaultValue: TOOL_SUMMARY_FALLBACK[key],
      ...values,
    });
  }

  /**
   * 分组显示名。规则与侧边栏 `useEntityName` 一致，保证 AI 说的名字用户能对上。
   *
   * 按 locale 缓存：关键词匹配要跑满全图上万个实体，每个都过一次 i18next
   * 查询会明显卡顿，而同一分组的名字对所有实例都是同一个。
   */
  private groupName(entityDataIdKey: string, category: string): string {
    const locale = this.ctx.i18nService.currentLocale;
    if (this.nameCacheLocale !== locale) {
      this.nameCacheLocale = locale;
      this.nameCache.clear();
    }
    const cached = this.nameCache.get(entityDataIdKey);
    if (cached !== undefined) return cached;

    const name = this.resolveGroupName(entityDataIdKey, category);
    this.nameCache.set(entityDataIdKey, name);
    return name;
  }

  private resolveGroupName(entityDataIdKey: string, category: string): string {
    if (category === ElectricPoleKey) {
      return this.translate(
        `sidebar:operation.electric_pole.create.device_type.options.${entityDataIdKey}`,
        entityDataIdKey
      );
    }
    if (category === CustomPointKey) {
      return this.translate(`common:custom_point.type.${entityDataIdKey}`, entityDataIdKey);
    }
    if (category === NoteKey) {
      return this.translate(`lang:${entityDataIdKey}`, entityDataIdKey);
    }
    const hash = this.ctx.langHashService.getHash(entityDataIdKey);
    return hash ? this.translate(`lang:${hash}`, entityDataIdKey) : entityDataIdKey;
  }

  private categoryName(category: string): string {
    return this.translate(`sidebar:filter.category.${category}`, category);
  }

  /** 当前视图中心的游戏世界坐标；地图未就绪时返回 undefined。 */
  private viewCenterWorld(mapId: string): { x: number; z: number } | undefined {
    const adapter = this.adapter;
    const center = adapter?.mapController.getCenter();
    if (!adapter || !center) return undefined;
    const world = adapter.mapController.dataManager.crd2xyz(center, mapId);
    return { x: world.x, z: world.z };
  }

  private instancesOf(mapId: string): EntityDataInstance[] {
    const adapter = this.adapter;
    if (!adapter || !adapter.entityController.dataManager.dataLoaded) return [];
    const result: EntityDataInstance[] = [];
    for (const manager of adapter.entityController.getMapGroupManagerList(mapId)) {
      result.push(...manager.instances);
    }
    return result;
  }

  private toBrief(instance: EntityDataInstance, reference?: { x: number; z: number }): PointBrief {
    const position = instance.position;
    return {
      id: instance.id,
      name: this.groupName(instance.entityDataIdKey, instance.category),
      groupKey: instance.entityDataIdKey,
      category: instance.category,
      mapId: instance.mapId,
      mapLevelId: instance.mapLevelId,
      x: round(position.x),
      z: round(position.z),
      marked: instance.marked,
      distance: reference ? round(Math.hypot(position.x - reference.x, position.z - reference.z)) : undefined,
    };
  }

  // #endregion

  // #region 查询筛选

  /**
   * 按参数筛点。`query_points` 与 `plan_collection_route` 共用，保证两者
   * 对「同一批点」的理解完全一致。
   */
  private selectInstances(args: Record<string, unknown>): {
    mapId: string;
    matched: EntityDataInstance[];
    reference?: { x: number; z: number };
  } {
    const mapId = this.resolveMapId(args.mapId);
    const keyword = asString(args.keyword)?.toLowerCase();
    const category = asString(args.category);
    const groupKey = asString(args.groupKey);
    const marked = asBoolean(args.marked);
    const maxDistance = asNumber(args.maxDistance);
    const nearX = asNumber(args.nearX);
    const nearZ = asNumber(args.nearZ);

    const explicitReference = nearX !== undefined && nearZ !== undefined ? { x: nearX, z: nearZ } : undefined;
    // 没给参考点但限定了半径 / 要求按距离排序时，默认以当前视图中心为准
    const reference =
      explicitReference ??
      (maxDistance !== undefined || args.sortByDistance === true ? this.viewCenterWorld(mapId) : undefined);

    // `instance.position` 是 computed + toJS，在非响应式上下文里每次访问都重算。
    // 一张图上万个点，筛选和排序会反复读，先摊平成一次。
    const entries = this.instancesOf(mapId).map((instance) => {
      const position = instance.position;
      return { instance, x: position.x, z: position.z, distance: 0 };
    });

    const filtered = entries.filter((entry) => {
      const instance = entry.instance;
      if (marked !== undefined && instance.marked !== marked) return false;
      if (category && instance.category !== category) return false;
      if (groupKey && instance.entityDataIdKey !== groupKey) return false;
      if (keyword) {
        const name = this.groupName(instance.entityDataIdKey, instance.category).toLowerCase();
        const categoryLabel = this.categoryName(instance.category).toLowerCase();
        if (
          !name.includes(keyword) &&
          !categoryLabel.includes(keyword) &&
          !instance.entityDataIdKey.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      if (reference) {
        entry.distance = Math.hypot(entry.x - reference.x, entry.z - reference.z);
        if (maxDistance !== undefined && entry.distance > maxDistance) return false;
      }
      return true;
    });

    if (reference) {
      filtered.sort((a, b) => a.distance - b.distance);
    }

    return { mapId, matched: filtered.map((entry) => entry.instance), reference };
  }

  // #endregion

  // #region 工具实现

  private getMapContext = (): AiToolResult => {
    const adapter = this.adapter;
    if (!adapter) {
      return { ok: false, data: { error: 'map adapter not ready' } };
    }
    const mapId = this.currentMapId;
    const center = this.viewCenterWorld(mapId);
    const tierDataManager = adapter.tierController.tierDataManager;

    return {
      ok: true,
      data: {
        currentMapId: mapId,
        availableMapIds: adapter.mapController.dataManager.mapIds,
        viewCenter: center ? { x: round(center.x), z: round(center.z) } : null,
        activeTier: tierDataManager.activeTier ?? null,
        activeSubTier: tierDataManager.activeSubTier ?? null,
        mapLevelIds: adapter.entityController.getMapLevelIds(mapId),
        selectedLevelIds: adapter.entityController.getSelectedLevelIds(mapId),
        language: this.ctx.i18nService.currentLocale,
      },
      summary: this.summary('map_context', { mapId }),
    };
  };

  private listPointGroups = (args: Record<string, unknown>): AiToolResult => {
    const adapter = this.adapter;
    if (!adapter) return { ok: false, data: { error: 'map adapter not ready' } };

    const mapId = this.resolveMapId(args.mapId);
    const category = asString(args.category);
    const groups = adapter.entityController
      .getMapGroupManagerList(mapId)
      .map((manager) => manager.stats)
      .filter((stats) => !category || stats.category === category)
      .map((stats) => ({
        groupKey: stats.entityDataIdKey,
        name: this.groupName(stats.entityDataIdKey, stats.category),
        category: stats.category,
        categoryName: this.categoryName(stats.category),
        count: stats.count,
        markedCount: stats.markedCount ?? 0,
        visible: stats.visible,
      }))
      .sort((a, b) => b.count - a.count);

    return { ok: true, data: { mapId, groups }, summary: this.summary('groups', { mapId, num: groups.length }) };
  };

  private queryPoints = (args: Record<string, unknown>): AiToolResult => {
    const { mapId, matched, reference } = this.selectInstances(args);
    const limit = Math.min(asNumber(args.limit) ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
    const points = matched.slice(0, limit).map((instance) => this.toBrief(instance, reference));

    return {
      ok: true,
      data: {
        mapId,
        total: matched.length,
        returned: points.length,
        truncated: matched.length > points.length,
        reference: reference ? { x: round(reference.x), z: round(reference.z) } : null,
        points,
      },
      summary: this.summary('query', { total: matched.length, returned: points.length }),
    };
  };

  private focusPoint = async (args: Record<string, unknown>): Promise<AiToolResult> => {
    const id = asNumber(args.id);
    if (id === undefined) return { ok: false, data: { error: 'id is required' } };

    const moved = await this.ctx.mapDataService.moveToEntity(id, true, true);
    return moved
      ? { ok: true, data: { id, focused: true }, summary: this.summary('focus', { id }) }
      : { ok: false, data: { id, error: 'point not found' }, summary: this.summary('focus_failed', { id }) };
  };

  private markPoints = async (args: Record<string, unknown>): Promise<AiToolResult> => {
    const ids = asNumberArray(args.ids);
    const marked = asBoolean(args.marked) ?? true;
    if (ids.length === 0) return { ok: false, data: { error: 'ids is required' } };

    const mapId = this.resolveMapId(args.mapId);
    const adapter = this.adapter;
    // 只标记确实存在、且可标记的点，避免模型编出来的 id 污染用户数据
    const valid = ids.filter((id) => {
      const instance = adapter?.entityController.getInstanceById(mapId, id);
      return !!instance && instance.markable;
    });
    // await 持久化：应答的 ok 必须反映真实落库结果，失败时用户侧另有告警
    let persisted = true;
    if (valid.length > 0) {
      persisted = await this.ctx.mapDataService.entityDataService.markEntities(mapId, valid, marked);
    }

    return {
      ok: valid.length > 0 && persisted,
      data: { mapId, marked, applied: valid.length, skipped: ids.length - valid.length, persisted },
      summary: this.summary(marked ? 'mark' : 'unmark', { num: valid.length }),
    };
  };

  private highlightPoints = (args: Record<string, unknown>): AiToolResult => {
    const adapter = this.adapter;
    if (!adapter) return { ok: false, data: { error: 'map adapter not ready' } };

    const mapId = this.resolveMapId(args.mapId);
    const selected = asBoolean(args.selected) ?? true;
    const ids = asNumberArray(args.ids);
    if (ids.length === 0) return { ok: false, data: { error: 'ids is required' } };

    // 与 markPoints 同口径：只作用于确实存在的点，编造的 id 计入 skipped，
    // 否则模型拿到 ok:true 却看不到任何高亮，会被误导着继续编。
    const valid = ids.filter((id) => !!adapter.entityController.getInstanceById(mapId, id));
    if (valid.length > 0) {
      adapter.entityController.batchSetSelected(valid.map((id) => ({ mapId, levelLogicId: id, selected })));
    }

    return {
      ok: valid.length > 0,
      data: { mapId, selected, applied: valid.length, skipped: ids.length - valid.length },
      summary: this.summary(selected ? 'highlight' : 'unhighlight', { num: valid.length }),
    };
  };

  private planRoute = async (args: Record<string, unknown>): Promise<AiToolResult> => {
    const explicitIds = asNumberArray(args.pointIds);
    const mapId = this.resolveMapId(args.mapId);
    const adapter = this.adapter;
    if (!adapter) return { ok: false, data: { error: 'map adapter not ready' } };

    let instances: EntityDataInstance[];
    if (explicitIds.length > 0) {
      instances = explicitIds
        .map((id) => adapter.entityController.getInstanceById(mapId, id))
        .filter((instance): instance is EntityDataInstance => !!instance);
    } else {
      instances = this.selectInstances({ ...args, mapId }).matched;
    }

    if (instances.length === 0) {
      return { ok: false, data: { error: 'no points matched' }, summary: this.summary('route_empty') };
    }
    const truncated = instances.length > MAX_ROUTE_POINTS;
    if (truncated) {
      instances = instances.slice(0, MAX_ROUTE_POINTS);
    }

    const startX = asNumber(args.startX);
    const startZ = asNumber(args.startZ);
    const start =
      startX !== undefined && startZ !== undefined
        ? { x: startX, z: startZ }
        : args.startFromViewCenter === false
          ? undefined
          : this.viewCenterWorld(mapId);

    const plan = planCollectionRoute(
      instances.map((instance) => ({ id: instance.id, x: instance.position.x, z: instance.position.z, instance })),
      start
    );

    const ordered = plan.ordered.map((point, index) => ({
      order: index + 1,
      ...this.toBrief(point.instance),
    }));

    // 存成本地路线后地图上会直接画出折线，用户不用照着列表自己连
    let savedRouteId: string | undefined;
    const routeName = asString(args.saveAsRouteName);
    if (routeName) {
      const points: StoredRoutePoint[] = plan.ordered.map((point) => ({
        x: point.instance.position.x,
        y: point.instance.position.y,
        z: point.instance.position.z,
        levelLogicId: point.id,
      }));
      const route = await this.ctx.mapDataService.routeDataService.saveRouteFromPoints(routeName, mapId, points, 'AI');
      savedRouteId = route?.id;
    }

    return {
      ok: true,
      data: {
        mapId,
        start: start ? { x: round(start.x), z: round(start.z) } : null,
        pointCount: ordered.length,
        truncated,
        totalDistance: round(plan.totalDistance),
        greedyDistance: round(plan.greedyDistance),
        savedRouteId: savedRouteId ?? null,
        ordered,
      },
      summary: this.summary(savedRouteId ? 'route_saved' : 'route', {
        num: ordered.length,
        distance: Math.round(plan.totalDistance),
      }),
    };
  };

  // #endregion

  /** 发给模型的工具清单。 */
  public get tools(): Record<string, AiTool> {
    return {
      get_map_context: {
        schema: {
          type: 'function',
          function: {
            name: 'get_map_context',
            description:
              '获取地图当前状态：当前地图 id、可切换的地图、视图中心的游戏世界坐标、已激活的分层、区域筛选。任何依赖“当前/附近”的问题都先调它。',
            parameters: { type: 'object', properties: {}, additionalProperties: false },
          },
        },
        execute: () => this.getMapContext(),
      },

      list_point_groups: {
        schema: {
          type: 'function',
          function: {
            name: 'list_point_groups',
            description:
              '列出某张地图上的点位分组（宝箱、醚质、矿物等），含总数与已标记数。用户提到某类资源但你不确定确切名称时，先用它对齐 groupKey。',
            parameters: {
              type: 'object',
              properties: {
                mapId: { type: 'string', description: '地图 id，缺省为当前地图' },
                category: { type: 'string', description: '只看某个大类，如 trchest / ether / mineral' },
              },
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.listPointGroups(args),
      },

      query_points: {
        schema: {
          type: 'function',
          function: {
            name: 'query_points',
            description:
              '按条件查询点位，返回 id、名称、世界坐标、是否已标记。给了 nearX/nearZ 或 maxDistance 时按距离升序返回并附带距离。',
            parameters: {
              type: 'object',
              properties: {
                mapId: { type: 'string', description: '地图 id，缺省为当前地图' },
                keyword: { type: 'string', description: '按点位名称/分类名模糊匹配' },
                category: { type: 'string', description: '大类过滤' },
                groupKey: { type: 'string', description: '精确分组 key（来自 list_point_groups）' },
                marked: { type: 'boolean', description: 'true 只看已标记，false 只看未标记' },
                nearX: { type: 'number', description: '参考点世界坐标 x' },
                nearZ: { type: 'number', description: '参考点世界坐标 z' },
                maxDistance: { type: 'number', description: '距参考点的最大水平距离；未给参考点则用视图中心' },
                sortByDistance: { type: 'boolean', description: '按到视图中心的距离排序' },
                limit: {
                  type: 'number',
                  description: `返回条数，默认 ${DEFAULT_QUERY_LIMIT}，上限 ${MAX_QUERY_LIMIT}`,
                },
              },
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.queryPoints(args),
      },

      focus_point: {
        schema: {
          type: 'function',
          function: {
            name: 'focus_point',
            description: '把地图视角移动到指定点位并打开它的详情弹窗（必要时自动切图、恢复该分组显示）。',
            parameters: {
              type: 'object',
              properties: { id: { type: 'number', description: '点位 id（levelLogicId）' } },
              required: ['id'],
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.focusPoint(args),
      },

      mark_points: {
        schema: {
          type: 'function',
          function: {
            name: 'mark_points',
            description:
              '批量标记 / 取消标记点位，等同于用户手动打勾，会写入本地并参与云端同步。只在用户明确要求时调用。',
            parameters: {
              type: 'object',
              properties: {
                ids: { type: 'array', items: { type: 'number' }, description: '点位 id 列表' },
                marked: { type: 'boolean', description: 'true 标记，false 取消标记，默认 true' },
                mapId: { type: 'string', description: '地图 id，缺省为当前地图' },
              },
              required: ['ids'],
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.markPoints(args),
      },

      highlight_points: {
        schema: {
          type: 'function',
          function: {
            name: 'highlight_points',
            description: '在地图上高亮（选中）一批点位，方便用户一眼看到你说的是哪些点。不会改动标记状态。',
            parameters: {
              type: 'object',
              properties: {
                ids: { type: 'array', items: { type: 'number' }, description: '点位 id 列表' },
                selected: { type: 'boolean', description: 'true 高亮，false 取消高亮，默认 true' },
                mapId: { type: 'string', description: '地图 id，缺省为当前地图' },
              },
              required: ['ids'],
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.highlightPoints(args),
      },

      plan_collection_route: {
        schema: {
          type: 'function',
          function: {
            name: 'plan_collection_route',
            description:
              '为一批点位规划最优采集顺序（最近邻 + 2-opt 的开放路径 TSP），返回按顺序排好的点位与总路程。传 saveAsRouteName 可直接存成地图上的路线画出来。可以给 pointIds，也可以直接给和 query_points 一样的筛选条件。',
            parameters: {
              type: 'object',
              properties: {
                pointIds: { type: 'array', items: { type: 'number' }, description: '要采集的点位 id 列表' },
                mapId: { type: 'string', description: '地图 id，缺省为当前地图' },
                keyword: { type: 'string', description: '未给 pointIds 时的筛选条件，同 query_points' },
                category: { type: 'string', description: '未给 pointIds 时的筛选条件，同 query_points' },
                groupKey: { type: 'string', description: '未给 pointIds 时的筛选条件，同 query_points' },
                marked: { type: 'boolean', description: '未给 pointIds 时的筛选条件，同 query_points' },
                maxDistance: { type: 'number', description: '未给 pointIds 时的筛选条件，同 query_points' },
                startX: { type: 'number', description: '出发点世界坐标 x' },
                startZ: { type: 'number', description: '出发点世界坐标 z' },
                startFromViewCenter: { type: 'boolean', description: '默认 true：以当前视图中心为出发点' },
                saveAsRouteName: { type: 'string', description: '给了名字就把结果保存成本地路线并在地图上绘制' },
              },
              additionalProperties: false,
            },
          },
        },
        execute: (args) => this.planRoute(args),
      },
    };
  }
}
