import type {
  ElectricPoleType,
  PresetStoreDetailData,
  PresetStoreDetailResponseItem,
  PresetStoreResponseItem,
  PresetStoreSearchOptions,
  PresetType,
} from '@/@types/preset_store';
import type { CustomPointNodeSchemaType } from '@/services/data/db/schema/user_data/custom_point';
import type { ElectricPoleNodeSchemaType } from '@/services/data/db/schema/user_data/electric_pole';
import { serverService } from '@/services/server';

export class PresetService {
  public static instance: PresetService;
  constructor() {}

  public static getInstance() {
    if (!PresetService.instance) {
      PresetService.instance = new PresetService();
    }
    return PresetService.instance;
  }

  /**
   * 获取电线杆预设列表
   * @param page 页码
   * @param pageSize 每页数量
   * @param type 电线杆类型
   * @param searchOptions 搜索选项
   * @returns
   */
  public getElectricPolePresets(
    page: number = 1,
    pageSize: number = 6,
    type: ElectricPoleType = 'pole',
    searchOptions?: PresetStoreSearchOptions
  ) {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    params.set('sub_type', type);
    if (searchOptions?.keyword) {
      params.set('name', searchOptions.keyword);
    }
    if (searchOptions?.sortBy) {
      params.set('sort_by', searchOptions.sortBy);
    }
    if (searchOptions?.sortOrder) {
      params.set('sort_order', searchOptions.sortOrder);
    }
    return serverService.apiGet<{
      list: PresetStoreResponseItem[];
      count: number;
    }>('/share/presets/electric-pole', params);
  }

  /**
   * 获取自定义点预设列表
   * @param page 页码
   * @param pageSize 每页数量
   * @param searchOptions 搜索选项
   * @returns
   */
  public getCustomPointPresets(page: number = 1, pageSize: number = 6, searchOptions?: PresetStoreSearchOptions) {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    if (searchOptions?.keyword) {
      params.set('name', searchOptions.keyword);
    }
    if (searchOptions?.sortBy) {
      params.set('sort_by', searchOptions.sortBy);
    }
    if (searchOptions?.sortOrder) {
      params.set('sort_order', searchOptions.sortOrder);
    }
    return serverService.apiGet<{
      list: PresetStoreResponseItem[];
      count: number;
    }>('/share/presets/custom-point', params);
  }

  /**
   * 获取预设详情
   * @param id 预设ID
   * @returns
   */
  public async getPresetDetail(id: number) {
    const data = await serverService.apiGet<PresetStoreDetailResponseItem>(`/share/presets/${id}`);
    return {
      ...data,
      snapshot: JSON.parse(data.snapshot),
    } as PresetStoreDetailData<'electric_pole'>;
  }

  /**
   * 获取预设详情(通过分享码)
   * @param code 预设分享码
   * @returns
   */
  public async getPresetDetailByCode(code: string) {
    const data = await serverService.apiGet<PresetStoreDetailResponseItem>(`/share/presets/code/${code}`);
    return {
      ...data,
      snapshot: JSON.parse(data.snapshot),
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
    return serverService.apiPost('/share/presets', {
      preset_type: 'electric_pole',
      name,
      description,
      is_public: true,
      sub_type: type,
      snapshot: JSON.stringify(snapshot),
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
    return serverService.apiPost('/share/presets', {
      preset_type: 'custom_point',
      sub_type: '',
      name,
      description,
      is_public: true,
      snapshot: JSON.stringify(snapshot),
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
    return serverService.apiPut<PresetStoreResponseItem>(`/share/presets/${id}`, updateData);
  }

  /**
   * 删除分享的预设
   * @param id 预设ID
   * @returns
   */
  public deleteSharePreset(id: number) {
    return serverService.apiDelete<PresetStoreResponseItem>(`/share/presets/${id}`);
  }

  /**
   * 获取预设导入数据(这个行为会增加预设的导入次数)
   * @param id 预设ID
   * @returns
   */
  public async getPresetImportData<T extends PresetType = 'electric_pole'>(id: number) {
    const data = await serverService.apiPost<PresetStoreDetailResponseItem>(`/share/presets/${id}/import`);
    return {
      ...data,
      snapshot: JSON.parse(data.snapshot),
    } as PresetStoreDetailData<T>;
  }

  /**
   * 点赞预设
   * @param id 预设ID
   * @returns
   */
  public likePreset(id: number) {
    return serverService.apiPost<PresetStoreResponseItem>(`/share/presets/${id}/like`);
  }

  /**
   * 取消点赞预设
   * @param id 预设ID
   * @returns
   */
  public unlikePreset(id: number) {
    return serverService.apiDelete<PresetStoreResponseItem>(`/share/presets/${id}/like`);
  }

  /**
   * 获取我分享的预设
   * @param page 页码
   * @param pageSize 每页数量
   * @returns
   */
  public getMineSharePresets(page: number = 1, pageSize: number = 10, type: PresetType = 'electric_pole') {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    params.set('preset_type', type);
    return serverService.apiGet<{ list: PresetStoreResponseItem[]; count: number }>('/share/presets/mine', params);
  }

  /**
   * 获取我收藏的预设
   * @param page 页码
   * @param pageSize 每页数量
   * @returns
   */
  public getMineLikedPresets(page: number = 1, pageSize: number = 10, type: PresetType = 'electric_pole') {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    params.set('preset_type', type);
    return serverService.apiGet<{ list: PresetStoreResponseItem[]; count: number }>('/share/presets/liked', params);
  }
}

export const presetService = PresetService.getInstance();
