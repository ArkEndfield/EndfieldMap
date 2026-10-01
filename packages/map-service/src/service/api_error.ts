/**
 * API 错误：携带 V2 后端的 HTTP status 与机器可读错误码
 * （错误体 {error:{code,message}}）。需要按 code 分派的调用方
 * （如 guide 创建时 GUIDE_ALREADY_EXISTS 改走更新）catch 后判 e.code。
 *
 * 独立成模块而不放在 server.ts：避免仅需错误类型的调用方（如 guide.ts）
 * 在运行时引入整个传输层依赖链。
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
