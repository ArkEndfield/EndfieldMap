import type { StorageType } from '@endfieldmap/tools/const/enum';

// 存储项结构
export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry: number | null; // null表示永不过期
}

// 存储配置接口
export interface StorageConfig {
  name: string;
  version: number;
  description: string;
  defaultExpiry?: number; // 默认过期时间（毫秒），可选
}

// 设置选项
export interface SetOptions {
  expiry?: number | null; // 过期时间（毫秒），null表示永不过期
  type?: StorageType; // 存储类型
}
