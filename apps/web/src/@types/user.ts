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
  last_login_ip: string;
  last_login_at: number;
  created_at: number;
};
