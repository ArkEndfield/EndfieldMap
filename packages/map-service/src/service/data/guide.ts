import type { GuideInfo } from '@endfieldmap/map-service/@types/guide';
import { ApiError } from '@endfieldmap/map-service/service/api_error';
import type { ServerService } from '@endfieldmap/map-service/service/server';

export interface GuideDataServiceConfig {
  serverService: ServerService;
}

/** 后端业务错误码（V2 契约：错误体 {error:{code,message}} 的字符串 code） */
export const GuideErrorCode = {
  /** 内部 ID 已存在，应改走 PATCH 追加 */
  AlreadyExists: 'GUIDE_ALREADY_EXISTS',
  /** 图片上传失败（含部分失败：记录已创建但部分图片未传上） */
  UploadFailed: 'TEABLE_UNAVAILABLE',
} as const;

export type GuideErrorCodeValue = (typeof GuideErrorCode)[keyof typeof GuideErrorCode];

/**
 * 业务错误：暴露后端的 code 字段以便上层针对性处理
 */
export class GuideApiError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'GuideApiError';
    this.code = code;
  }
}

/** 创建标点请求体 */
export interface CreateGuideReq {
  internal_id: number;
  area: string;
  marker_type: string;
  description: string;
  layer_map?: string;
  visible?: string;
  images?: string[];
}

/** 更新标点请求体 */
export interface UpdateGuideReq {
  internal_id?: number;
  area?: string;
  marker_type?: string;
  description?: string;
  layer_map?: string;
  visible?: string;
  progress?: string;
  images?: string[];
}

/** V2 /guides/* 的 wire 形状（裸 JSON，无信封，omitempty 字段可缺省） */
interface GuideWire {
  record_id: string;
  internal_id: number;
  area?: string;
  marker_type?: string;
  description?: string;
  layer_map?: string;
  map?: string;
  visible?: string;
  refreshable?: '' | '是' | '否';
  progress?: string;
  images?: string[];
  /** 注意：V2 的 video 元素是 Teable 附件 ID（旧版 video_links 是标题/链接文本） */
  video?: string[];
}

function toGuideInfo(g: GuideWire): GuideInfo {
  return {
    record_id: g.record_id,
    internal_id: g.internal_id,
    area: g.area ?? '',
    marker_type: g.marker_type ?? '',
    description: g.description ?? '',
    progress: g.progress ?? '',
    layer_map: g.layer_map ?? '',
    visible: g.visible ?? '',
    refreshable: g.refreshable ?? '',
    images: g.images ?? null,
    video_links: g.video ?? null,
  };
}

export class GuideDataService {
  private serverService: ServerService;

  constructor(config: GuideDataServiceConfig) {
    this.serverService = config.serverService as ServerService;
  }

  public async getGuide(id: number, options?: RequestInit): Promise<GuideInfo | null> {
    const wire = await this.serverService.apiGet<GuideWire>(`/guides/${id}`, undefined, options);
    return toGuideInfo(wire);
  }

  /**
   * 创建标点（POST /api/v1/guides）
   * - 若标点已存在，后端返回 409 + code=GUIDE_ALREADY_EXISTS，上层需改走 update
   * - 若图片上传失败，后端返回 502 + code=TEABLE_UNAVAILABLE
   */
  public async createGuide(body: CreateGuideReq, options?: RequestInit): Promise<void> {
    await this.guideMutateRequest('/api/v1/guides', 'POST', body, options);
  }

  /**
   * 更新标点（PATCH /api/v1/guides/:record_id）
   * - images 字段是追加语义，由后端实现
   */
  public async updateGuide(
    recordId: string,
    body: UpdateGuideReq,
    options?: RequestInit
  ): Promise<void> {
    await this.guideMutateRequest(`/api/v1/guides/${encodeURIComponent(recordId)}`, 'PATCH', body, options);
  }

  /**
   * 自己组装请求以保留后端的 code 字段（apiRequest 的错误不含 code 分派语义，
   * 这里捕获 ApiError 后转 GuideApiError 暴露给上层）
   */
  private async guideMutateRequest(
    fullApiUrl: string,
    method: 'POST' | 'PATCH',
    body: CreateGuideReq | UpdateGuideReq,
    options?: RequestInit
  ): Promise<void> {
    const token = this.serverService.getToken();
    if (!token) {
      throw new GuideApiError('UNAUTHORIZED', 'not_login');
    }
    try {
      await this.serverService.request<unknown>(fullApiUrl, {
        method,
        body: JSON.stringify(body),
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options?.headers || {}),
        },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        throw new GuideApiError(e.code, e.message);
      }
      throw e;
    }
  }
}
