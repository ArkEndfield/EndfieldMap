import type {
  ElectricPoleType,
  PresetStoreDetailData,
  PresetStoreResponseItem,
  PresetStoreSearchOptions,
  PresetType,
} from '@endfieldmap/map-service/@types/preset_store';
import type { CustomPointNodeSchemaType } from '@endfieldmap/map-service/service/db/schema/user_data/custom_point';
import type { ElectricPoleNodeSchemaType } from '@endfieldmap/map-service/service/db/schema/user_data/electric_pole';
import { ServerService } from '@endfieldmap/map-service/service/server';

export interface PresetServiceConfig {
  serverService: ServerService;
}

/** V2 /share/presets* 的 wire 形状（裸 JSON；created_at 为 ISO 字符串，snapshot 为解析好的 JSON 值） */
interface ShareWire {
  id: number;
  share_code: string;
  preset_type: PresetType;
  sub_type?: string;
  name: string;
  description?: string;
  is_public: boolean;
  import_count: number;
  like_count: number;
  view_count: number;
  user_id: number;
  nickname?: string;
  is_liked?: boolean;
  created_at?: string;
  snapshot?: unknown;
}

function isoToUnix(s?: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : Math.floor(t / 1000);
}

function toPresetItem(s: ShareWire): PresetStoreResponseItem {
  const created = isoToUnix(s.created_at);
  return {
    id: s.id,
    share_code: s.share_code,
    preset_type: s.preset_type,
    sub_type: (s.sub_type ?? '') as ElectricPoleType,
    name: s.name,
    description: s.description ?? '',
    is_public: s.is_public,
    import_count: s.import_count,
    like_count: s.like_count,
    view_count: s.view_count,
    user_id: s.user_id,
    user_nickname: s.nickname ?? '',
    created_at: created,
    updated_at: created, // V2 不再返回 updated_at
    is_liked: s.is_liked ?? false,
  };
}

/** V2 的 snapshot 是解析好的 JSON 值；兼容旧版的字符串形态 */
function parseSnapshot(snapshot: unknown): unknown {
  if (typeof snapshot === 'string') {
    return JSON.parse(snapshot);
  }
  return snapshot;
}

export class PresetService {
  private readonly serverService: ServerService;
  constructor(config: PresetServiceConfig) {
    this.serverService = config.serverService;
  }

  /**
   * 获取电线杆预设列表
   * @param page 页码
   * @param pageSize 每页数量
   * @param type 电线杆类型
   * @param searchOptions 搜索选项（V2 列表端点暂不支持 name/sort，预留）
   * @returns
   */
  public async getElectricPolePresets(
    page: number = 1,
    pageSize: number = 6,
    type: ElectricPoleType = 'pole',
    searchOptions?: PresetStoreSearchOptions
  ): Promise<{ list: PresetStoreResponseItem[]; count: number }> {
    void searchOptions; // V2 列表端点暂无 name/sort_by/sort_order 参数，待后端补齐
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', pageSize.toString()); // V2：分页参数名是 size（旧版为 limit）
    params.set('sub_type', type);
    const data = await this.serverService.apiGet<{ shares: ShareWire[]; total: number }>(
      '/share/presets/electric-pole',
      params
    );
    return { list: (data.shares ?? []).map(toPresetItem), count: data.total ?? 0 };
  }

  /**
   * 获取自定义点预设列表
   * @param page 页码
   * @param pageSize 每页数量
   * @param searchOptions 搜索选项（V2 列表端点暂不支持 name/sort，预留）
   * @returns
   */
  public async getCustomPointPresets(
    page: number = 1,
    pageSize: number = 6,
    searchOptions?: PresetStoreSearchOptions
  ): Promise<{ list: PresetStoreResponseItem[]; count: number }> {
    void searchOptions; // V2 列表端点暂无 name/sort_by/sort_order 参数，待后端补齐
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', pageSize.toString());
    const data = await this.serverService.apiGet<{ shares: ShareWire[]; total: number }>(
      '/share/presets/custom-point',
      params
    );
    return { list: (data.shares ?? []).map(toPresetItem), count: data.total ?? 0 };
  }

  /**
   * 获取预设详情
   * @param id 预设ID
   * @returns
   */
  public async getPresetDetail(id: number) {
    const data = await this.serverService.apiGet<ShareWire>(`/share/presets/${id}`);
    return {
      ...toPresetItem(data),
      source_preset_id: 0, // V2 不再返回该字段
      snapshot: parseSnapshot(data.snapshot),
    } as PresetStoreDetailData<'electric_pole'>;
  }

  /**
   * 获取预设详情(通过分享码)
   * @param code 预设分享码
   * @returns
   */
  public async getPresetDetailByCode(code: string) {
    const data = await this.serverService.apiGet<ShareWire>(`/share/presets/code/${code}`);
    return {
      ...toPresetItem(data),
      source_preset_id: 0,
      snapshot: parseSnapshot(data.snapshot),
    } as PresetStoreDetailData<'custom_point'>;
  }

  /**
   * 分享电线杆预设
   * @param name 预设名称
   * @param description 预设描述
   * @param type 电线杆类型
   * @param snapshot 电线杆数据
   * @returns
   */
  public shareElectricPolePreset(
    name: string,
    description: string,
    type: ElectricPoleType,
    snapshot: ElectricPoleNodeSchemaType[]
  ) {
    // V2：snapshot 直接传 JSON 值（旧版需 stringify）
    return this.serverService.apiPost('/share/presets', {
      preset_type: 'electric_pole',
      name,
      description,
      is_public: true,
      sub_type: type,
      snapshot,
    });
  }

  /**
   * 分享自定义点预设
   * @param name 预设名称
   * @param description 预设描述
   * @param snapshot 自定义点数据
   * @returns
   */
  public shareCustomPointPreset(name: string, description: string, snapshot: CustomPointNodeSchemaType[]) {
    return this.serverService.apiPost('/share/presets', {
      preset_type: 'custom_point',
      sub_type: '',
      name,
      description,
      is_public: true,
      snapshot,
    });
  }

  /**
   * 更新分享的预设
   * @param id 预设ID
   * @param updateData 更新数据
   * @returns
   */
  public updateSharePreset(
    id: number,
    updateData: {
      name?: string;
      description?: string;
      is_public?: boolean;
    }
  ) {
    return this.serverService.apiPut(`/share/presets/${id}`, updateData);
  }

  /**
   * 删除分享的预设
   * @param id 预设ID
   * @returns
   */
  public deleteSharePreset(id: number) {
    return this.serverService.apiDelete(`/share/presets/${id}`);
  }

  /**
   * 获取预设导入数据(这个行为会增加预设的导入次数)
   * @param id 预设ID
   * @returns
   */
  public async getPresetImportData<T extends PresetType = 'electric_pole'>(id: number) {
    const data = await this.serverService.apiPost<ShareWire>(`/share/presets/${id}/import`);
    return {
      ...toPresetItem(data),
      source_preset_id: 0,
      snapshot: parseSnapshot(data.snapshot),
    } as PresetStoreDetailData<T>;
  }

  /**
   * 点赞预设
   * @param id 预设ID
   * @returns
   */
  public likePreset(id: number) {
    return this.serverService.apiPost(`/share/presets/${id}/like`);
  }

  /**
   * 取消点赞预设
   * @param id 预设ID
   * @returns
   */
  public unlikePreset(id: number) {
    return this.serverService.apiDelete(`/share/presets/${id}/like`);
  }

  /**
   * 获取我分享的预设
   * 注意：V2 的 mine/liked 端点不支持 preset_type 过滤，这里在客户端过滤，
   * count 因此是本页过滤后的长度（分页总数偏差，待后端补齐过滤参数）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns
   */
  public async getMineSharePresets(
    page: number = 1,
    pageSize: number = 10,
    type: PresetType = 'electric_pole'
  ): Promise<{ list: PresetStoreResponseItem[]; count: number }> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', pageSize.toString());
    const data = await this.serverService.apiGet<{ shares: ShareWire[]; total: number }>(
      '/share/presets/mine',
      params
    );
    const list = (data.shares ?? []).map(toPresetItem).filter((i) => i.preset_type === type);
    return { list, count: list.length };
  }

  /**
   * 获取我收藏的预设（preset_type 客户端过滤，同 getMineSharePresets 的说明）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns
   */
  public async getMineLikedPresets(
    page: number = 1,
    pageSize: number = 10,
    type: PresetType = 'electric_pole'
  ): Promise<{ list: PresetStoreResponseItem[]; count: number }> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', pageSize.toString());
    const data = await this.serverService.apiGet<{ shares: ShareWire[]; total: number }>(
      '/share/presets/liked',
      params
    );
    const list = (data.shares ?? []).map(toPresetItem).filter((i) => i.preset_type === type);
    return { list, count: list.length };
  }
}
