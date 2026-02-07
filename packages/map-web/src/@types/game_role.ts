/**
 * 游戏角色信息（从鹰角服务器获取的可绑定角色）
 */
export interface GameRole {
  /** 游戏 UID */
  uid: string;
  /** 渠道名称 */
  channel_name: string;
  /** 服务器 ID */
  server_id: string;
  /** 服务器名称 */
  server_name: string;
  /** 角色 ID (platformRoleId)，用于绑定操作 */
  role_id: string;
  /** 角色昵称 */
  nick_name: string;
  /** 角色等级 */
  level: number;
}

/**
 * 扫码状态
 */
export type ScanStatus = 'pending' | 'confirmed' | 'expired';

/**
 * 扫码信息
 */
export interface ScanInfo {
  /** 扫码 ID */
  scan_id: string;
  /** 扫码 URL，用于生成二维码 */
  scan_url: string;
}

/**
 * 扫码状态响应
 */
export interface ScanStatusResponse {
  /** 扫码状态 */
  status: ScanStatus;
  /** 扫码成功时返回，用于获取角色列表 */
  scan_code: string | null;
}
