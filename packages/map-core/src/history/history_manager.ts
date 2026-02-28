import type { Command } from '@endfieldmap/map-core/history/command';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

/**
 * 历史记录管理器
 * 管理撤销/重做栈，支持命令模式
 */
export class HistoryManager {
  /** 撤销栈 */
  @observable.shallow
  private accessor undoStack: Command[] = [];

  /** 重做栈 */
  @observable.shallow
  private accessor redoStack: Command[] = [];

  /** 最大历史记录数 */
  private readonly maxHistory: number;

  /** 是否暂停记录 */
  private paused = false;

  /**
   * @param maxHistory 最大历史记录数，默认 50
   */
  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  /**
   * 执行命令并记录到历史
   */
  @action
  execute(command: Command): void {
    if (this.paused) {
      command.execute();
      return;
    }

    try {
      command.execute();
      this.undoStack.push(command);

      // 限制历史记录数量
      while (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }

      // 清空重做栈
      this.redoStack = [];

      logger.debug('[HistoryManager] Command executed:', command.description);
    } catch (error) {
      logger.error('[HistoryManager] Command execution failed:', error);
      throw error;
    }
  }

  /**
   * 撤销上一个命令
   */
  @action
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) {
      logger.debug('[HistoryManager] Nothing to undo');
      return false;
    }

    try {
      this.paused = true;
      command.undo();
      this.redoStack.push(command);
      logger.debug('[HistoryManager] Command undone:', command.description);
      return true;
    } catch (error) {
      logger.error('[HistoryManager] Undo failed:', error);
      return false;
    } finally {
      this.paused = false;
    }
  }

  /**
   * 重做上一个撤销的命令
   */
  @action
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) {
      logger.debug('[HistoryManager] Nothing to redo');
      return false;
    }

    try {
      this.paused = true;
      command.execute();
      this.undoStack.push(command);
      logger.debug('[HistoryManager] Command redone:', command.description);
      return true;
    } catch (error) {
      logger.error('[HistoryManager] Redo failed:', error);
      return false;
    } finally {
      this.paused = false;
    }
  }

  /**
   * 是否可以撤销
   */
  @computed
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 是否可以重做
   */
  @computed
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 获取撤销栈长度
   */
  @computed
  get undoCount(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈长度
   */
  @computed
  get redoCount(): number {
    return this.redoStack.length;
  }

  /**
   * 清空所有历史记录
   */
  @action
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    logger.debug('[HistoryManager] History cleared');
  }

  /**
   * 获取撤销栈中的命令描述列表
   */
  getUndoDescriptions(): string[] {
    return this.undoStack.map((cmd) => cmd.description).reverse();
  }

  /**
   * 获取重做栈中的命令描述列表
   */
  getRedoDescriptions(): string[] {
    return this.redoStack.map((cmd) => cmd.description).reverse();
  }
}

/** 全局历史记录管理器 */
export const historyManager = new HistoryManager();
