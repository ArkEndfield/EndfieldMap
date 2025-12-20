/**
 * 命令接口
 * 实现撤销/重做功能的基础
 */
export interface Command {
  /** 执行命令 */
  execute(): void;
  /** 撤销命令 */
  undo(): void;
  /** 命令描述（用于调试和日志） */
  readonly description: string;
}

/**
 * 命令类型标识
 */
export enum CommandType {
  CREATE_ELECTRIC_POLE = 'CREATE_ELECTRIC_POLE',
  DELETE_ELECTRIC_POLE = 'DELETE_ELECTRIC_POLE',
  CREATE_CUSTOM_POINT = 'CREATE_CUSTOM_POINT',
  DELETE_CUSTOM_POINT = 'DELETE_CUSTOM_POINT',
  UPDATE_CONNECTION = 'UPDATE_CONNECTION',
  BATCH_CREATE = 'BATCH_CREATE',
  BATCH_DELETE = 'BATCH_DELETE',
}
