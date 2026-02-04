// ==================== 类型定义 ====================
export interface UidData {
  uid: string;
  dataCount: number;
  isActive?: boolean;
}

export interface UserData {
  avatar: string;
  nickname: string;
  uid: string;
  isSynced: boolean;
  boundUidCount: number;
}
