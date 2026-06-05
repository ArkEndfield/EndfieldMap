import type { GuideInfo } from '@endfieldmap/map-service/@types/guide';
import type { ServerResponse } from '@endfieldmap/map-service/@types/server';
import type { ServerService } from '@endfieldmap/map-service/service/server';

export interface GuideDataServiceConfig {
  serverService: ServerService;
}

/** 后端业务错误码（来自 /Dijiang/pkg/code/guide.go） */
export const GuideErrorCode = {
  /** 内部 ID 已存在，应改走 PATCH 追加 */
  AlreadyExists: 80005,
  /** 图片上传失败 */
  UploadFailed: 80006,
} as const;

export type GuideErrorCodeValue = (typeof GuideErrorCode)[keyof typeof GuideErrorCode];

/**
 * 业务错误：暴露后端的 code 字段以便上层针对性处理
 * （ServerService.apiRequest 会丢失 code，因此本服务里走原始 request）
 */
export class GuideApiError extends Error {
  public readonly code: number;
  constructor(code: number, message: string) {
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

export class GuideDataService {
  private serverService: ServerService;

  constructor(config: GuideDataServiceConfig) {
    this.serverService = config.serverService as ServerService;
  }

  public async getGuide(id: number, options?: RequestInit): Promise<GuideInfo | null> {
    return this.serverService.apiGet<GuideInfo>(`/guides/${id}`, undefined, options);
  }

  /**
   * 创建标点（POST /api/v1/guides）
   * - 若标点已存在，后端会返回 code=80005，上层需改走 update
   * - 若图片上传失败，后端会返回 code=80006
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
   * 自己组装请求以保留后端的 code 字段（apiRequest 会丢弃 code）
   */
  private async guideMutateRequest(
    fullApiUrl: string,
    method: 'POST' | 'PATCH',
    body: CreateGuideReq | UpdateGuideReq,
    options?: RequestInit
  ): Promise<void> {
    const token = this.serverService.getToken();
    if (!token) {
      throw new GuideApiError(401, 'not_login');
    }
    const data = await this.serverService.request<ServerResponse<unknown>>(fullApiUrl, {
      method,
      body: JSON.stringify(body),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    });
    if (data.code !== 0) {
      throw new GuideApiError(data.code, data.message || 'unknown');
    }
  }
}
