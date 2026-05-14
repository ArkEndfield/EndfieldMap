import type { ServerResponse } from '@endfieldmap/map-service/@types/server';
import type {
  PullResponse,
  PushDocumentRow,
  PushResponse,
  SyncCheckpoint,
  SyncCollectionName,
} from '@endfieldmap/map-service/@types/sync';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { logger } from '@endfieldmap/tools';

export interface ServerServiceConfig {
  backendHost: string;
  i18nService: I18nService;
}

export class ServerService {
  private backendHost: string;
  private i18nService: I18nService;

  constructor(config: ServerServiceConfig) {
    this.backendHost = config.backendHost;
    this.i18nService = config.i18nService;
  }

  private token: string | null = null;
  private uid: string | null = null;
  private onUnauthorized: (() => void) | null = null;
  private onTokenRefreshed: ((token: string) => void) | null = null;
  private isRefreshing: boolean = false;
  // 是否正在执行登出操作，用于防止多个请求同时触发 logout
  private isLoggingOut: boolean = false;
  private requestsQueue: Array<{
    resolve: (token: string) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  /**
   * 设置当前 Token
   */
  public setToken(token: string | null) {
    this.token = token;
  }

  /**
   * 获取当前 Token（只读访问，给特殊路径请求用）
   */
  public getToken(): string | null {
    return this.token;
  }

  public setUid(uid?: string | null) {
    this.uid = uid || null;
  }

  /**
   * 设置 401 未授权处理器（通常是 logout）
   */
  public setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  /**
   * 重置登出状态
   * 在 logout 完成后调用，允许后续再次触发 logout
   */
  public resetLogoutState() {
    this.isLoggingOut = false;
  }

  /**
   * 安全地触发登出操作
   * 防止多个请求同时触发多次 logout
   */
  private triggerLogout() {
    if (this.isLoggingOut) {
      return;
    }
    this.isLoggingOut = true;
    this.onUnauthorized?.();
  }

  /**
   * 设置 Token 刷新成功后的回调
   */
  public setOnTokenRefreshed(handler: (token: string) => void) {
    this.onTokenRefreshed = handler;
  }

  /**
   * 等待 Token 刷新完成
   * 如果正在刷新，返回一个 Promise 等待新 Token
   * 如果没有刷新，返回 null
   */
  private waitForTokenRefresh(): Promise<string> | null {
    if (!this.isRefreshing) {
      return null;
    }

    return new Promise<string>((resolve, reject) => {
      this.requestsQueue.push({ resolve, reject });
    });
  }

  /**
   * 处理队列中的请求
   */
  private processQueue(error?: unknown) {
    if (error) {
      this.requestsQueue.forEach(({ reject }) => reject(error));
    } else {
      this.requestsQueue.forEach(({ resolve }) => resolve(this.token!));
    }
    this.requestsQueue = [];
  }

  /**
   * 处理 401 未授权响应
   * 发起刷新 Token 请求，成功后重试原始请求
   * @param url 请求的 URL
   * @param options 请求选项
   * @param backendMessage 后端返回的错误消息
   */
  private async unauthorizedHandler<T>(url: string, options?: RequestInit, backendMessage?: string): Promise<T> {
    // 如果没有 Token（登录/注册失败），直接拒绝，不尝试刷新
    if (!this.token) {
      // 如果是登录/注册请求，显示后端返回的 message
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        throw new Error(
          backendMessage ||
            this.i18nService.translate('unknown', {
              ns: 'error',
              defaultValue: '未知错误',
            })
        );
      }
      // 其他情况显示未登录
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }

    // 如果刷新 Token 的请求返回 401，直接 logout，防止无限循环
    if (url.includes('/auth/refresh')) {
      this.triggerLogout();
      throw new Error(
        this.i18nService.translate('unknown', {
          ns: 'error',
          defaultValue: '未知错误',
        })
      );
    }

    // 如果正在刷新 Token，等待刷新完成后重试
    const waitPromise = this.waitForTokenRefresh();
    if (waitPromise) {
      const newToken = await waitPromise;
      const retryOptions = {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${newToken}`,
        },
      };
      return this.request<T>(url, retryOptions, true);
    }

    // 开始刷新 Token
    this.isRefreshing = true;

    try {
      const refreshResponse = await this.request<ServerResponse<{ token: string; expire: string }>>(
        `/api/v1/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (refreshResponse.code !== 0) {
        throw new Error(
          refreshResponse.message ||
            this.i18nService.translate('unknown', {
              ns: 'error',
              defaultValue: '未知错误',
            })
        );
      }

      const response = refreshResponse.data;

      if (response?.token) {
        this.token = response.token;
        this.isRefreshing = false;

        this.onTokenRefreshed?.(this.token);
        this.processQueue();

        // 重试原始请求，标记为刷新后重试以防止再次进入刷新循环
        const retryOptions = {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${this.token}`,
          },
        };

        return this.request<T>(url, retryOptions, true);
      }

      throw new Error(
        refreshResponse.message ||
          this.i18nService.translate('unknown', {
            ns: 'error',
            defaultValue: '未知错误',
          })
      );
    } catch (error) {
      this.isRefreshing = false;
      this.processQueue(error);
      this.triggerLogout();
      throw error;
    }
  }

  /**
   * 底层请求方法
   * 不自动添加 Token 和 API 前缀
   * @param isRetryAfterRefresh 标记是否是刷新 token 后的重试请求，防止无限循环
   */
  public async request<T>(url: string, options?: RequestInit, isRetryAfterRefresh: boolean = false): Promise<T> {
    const fullURL = new URL(url, this.backendHost || window.location.origin);
    const response = await fetch(fullURL, options);

    if (response.status === 401) {
      // 如果是刷新 token 后的重试请求仍然 401，直接登出，不再尝试刷新
      if (isRetryAfterRefresh) {
        this.triggerLogout();
        throw new Error(
          this.i18nService.translate('not_login', {
            ns: 'error',
            defaultValue: '未登录',
          })
        );
      }

      // 解析响应体获取后端返回的 message
      let backendMessage: string | undefined;
      try {
        const errorData = await response.json();
        backendMessage = errorData?.message;
      } catch {
        logger.debug('Failed to parse 401 response body, using default message');
      }
      return this.unauthorizedHandler<T>(url, options, backendMessage);
    }

    if (!response.ok) {
      // 尝试获取后端返回的错误消息
      try {
        const errorData = await response.json();
        throw new Error(
          errorData?.message ||
            this.i18nService.translate('unknown', {
              ns: 'error',
              defaultValue: '未知错误',
            })
        );
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }
        // eslint-disable-next-line
        throw new Error(
          this.i18nService.translate('unknown', {
            ns: 'error',
            defaultValue: '未知错误',
          })
        );
      }
    }

    return (await response.json()) as T;
  }

  /**
   * API 请求方法
   * 自动添加 /api/v1 前缀和 Authorization 头
   * 如果正在刷新 Token，会等待刷新完成后再发起请求
   */
  public async apiRequest<T>(url: string, _options?: RequestInit) {
    const currentLocale = this.i18nService.currentLocale;
    // 如果正在刷新 Token，等待刷新完成
    const waitPromise = this.waitForTokenRefresh();
    if (waitPromise) {
      const newToken = await waitPromise;
      // 使用新 Token 发起请求
      const options = {
        ...(_options || {}),
        headers: {
          ...(_options?.headers || {}),
          Authorization: `Bearer ${newToken}`,
          Lang: currentLocale,
          Uid: this.uid || '',
        },
      };
      const fullApiUrl = `/api/v1${url}`;
      const data = await this.request<ServerResponse<T>>(fullApiUrl, options, true);

      if (data.code !== 0) {
        throw new Error(
          data.message ||
            this.i18nService.translate('unknown', {
              ns: 'error',
              defaultValue: '未知错误',
            })
        );
      }

      return data.data;
    }

    // 正常请求流程
    const options = {
      ...(_options || {}),
      headers: {
        'Content-Type': 'application/json',
        ...(_options?.headers || {}),
        Authorization: this.token ? `Bearer ${this.token}` : '',
        Lang: currentLocale,
        Uid: this.uid || '',
      },
    };

    const fullApiUrl = `/api/v1${url}`;
    const data = await this.request<ServerResponse<T>>(fullApiUrl, options);

    if (data.code !== 0) {
      throw new Error(
        data.message ||
          this.i18nService.translate('unknown', {
            ns: 'error',
            defaultValue: '未知错误',
          })
      );
    }

    return data.data;
  }

  public async apiPost<T, D = unknown>(url: string, data?: D, options?: RequestInit) {
    return this.apiRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  public async apiGet<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined | null> | URLSearchParams,
    options?: RequestInit
  ) {
    const searchParams = new URLSearchParams();
    if (params instanceof URLSearchParams) {
      params.forEach((value, key) => {
        searchParams.append(key, value);
      });
    } else if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const paramsString = searchParams.toString();
    return this.apiRequest<T>(`${url}${paramsString ? `?${paramsString}` : ''}`, {
      method: 'GET',
      ...options,
    });
  }

  public async apiPut<T, D = unknown>(url: string, data?: D, options?: RequestInit) {
    return this.apiRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  public async apiDelete<T>(url: string, options?: RequestInit) {
    return this.apiRequest<T>(url, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * 同步拉取 - 从服务端拉取指定 collection 的文档
   * @param collection 集合名称
   * @param checkpoint 检查点（用于增量同步）
   * @param limit 每次拉取数量
   */
  public async syncPull(
    collection: SyncCollectionName,
    checkpoint: SyncCheckpoint | null,
    limit: number = 50
  ): Promise<PullResponse> {
    if (!this.uid) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    const params = new URLSearchParams();
    if (checkpoint) {
      // RxDB 内部使用 camelCase (updatedAt)，但 SyncCheckpoint 类型使用 snake_case (updated_at)
      // 这里需要兼容两种情况
      const updatedAt =
        (checkpoint as { updated_at?: number; updatedAt?: number }).updated_at ??
        (checkpoint as { updated_at?: number; updatedAt?: number }).updatedAt;
      if (updatedAt !== undefined) {
        params.set('checkpoint_updated_at', updatedAt.toString());
      }
      params.set('checkpoint_id', checkpoint.id);
    }
    params.set('limit', limit.toString());
    params.set('role_id', this.uid);

    return this.apiGet<PullResponse>(`/sync/${collection}/pull`, params);
  }

  /**
   * 同步推送 - 向服务端推送文档更改
   * @param collection 集合名称
   * @param docs 推送的文档列表
   */
  public async syncPush(collection: SyncCollectionName, docs: PushDocumentRow[]): Promise<PushResponse> {
    if (!this.uid) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    const params = new URLSearchParams();
    params.set('role_id', this.uid);
    return this.apiPost<PushResponse>(`/sync/${collection}/push?${params.toString()}`, { docs });
  }
}
