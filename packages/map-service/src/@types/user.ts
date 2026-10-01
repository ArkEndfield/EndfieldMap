export type UidInfo = {
  uid: string;
  nickname: string;
  avatar: string;
  is_default: boolean;
};

export type UserInfo = {
  id: number;
  username: string;
  nickname: string;
  /** 以下字段 V2 后端不再返回，保留仅为类型兼容 */
  last_login_ip?: string;
  last_login_at?: number;
  created_at?: number;
};
