import { logger } from '@endfieldmap/tools';

export type ShortcutListener = (e: KeyboardEvent) => Promise<boolean | void> | boolean | void;

type Modifier = 'Ctrl' | 'Shift' | 'Alt' | 'Meta' | 'Cmd';
type Alphabet =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';
type Digits = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type FnKeys = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';
type SpecialKeys =
  | 'Escape'
  | 'Enter'
  | 'Tab'
  | 'Space'
  | 'Backspace'
  | 'Delete'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

type Key = Alphabet | Digits | FnKeys | SpecialKeys;

// 组合键的模板字面量类型
type Combo1 = `${Modifier}+${Key}`;
type Combo2 = `${Modifier}+${Modifier}+${Key}`;
type Combo3 = `${Modifier}+${Modifier}+${Modifier}+${Key}`;

// 允许带有自动完成的格式化字符串，以及任意字符串（作为后备）
export type ShortcutString = Key | Combo1 | Combo2 | Combo3 | (string & {});

class ShortcutService {
  private listeners: ShortcutListener[] = [];
  private isExecuting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  /**
   * 注册快捷键监听器。
   * 执行顺序为 LIFO（后进先出）。
   * @param shortcut 可选的快捷键组合字符串。例如：'Ctrl+S', ['Esc', 'Enter']。
   * @param listener 按下键盘时调用的函数。
   * @returns 用于取消注册监听器的清理函数。
   */
  public register(listener: ShortcutListener): () => void;
  public register(shortcut: ShortcutString | ShortcutString[], listener: ShortcutListener): () => void;
  public register(
    shortcutOrListener: ShortcutString | ShortcutString[] | ShortcutListener,
    listener?: ShortcutListener
  ): () => void {
    let finalListener: ShortcutListener;

    if (typeof shortcutOrListener === 'function') {
      finalListener = shortcutOrListener;
    } else {
      const shortcuts = Array.isArray(shortcutOrListener) ? shortcutOrListener : [shortcutOrListener];
      if (!listener) {
        throw new Error('注册快捷键时必须提供监听器');
      }
      finalListener = (e: KeyboardEvent) => {
        if (this.matchesAny(e, shortcuts)) {
          return listener(e);
        }
      };
    }

    this.listeners.push(finalListener);
    return () => this.unregister(finalListener);
  }

  /**
   * 取消注册快捷键监听器。
   * @param listener 要移除的监听器。
   */
  public unregister = (listener: ShortcutListener): void => {
    this.listeners = this.listeners.filter((l) => l !== listener);
  };

  private matchesAny(e: KeyboardEvent, shortcuts: string[]): boolean {
    return shortcuts.some((s) => this.matches(e, s));
  }

  private matches(e: KeyboardEvent, shortcut: string): boolean {
    const parts = shortcut
      .toLowerCase()
      .split('+')
      .map((p) => p.trim());
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);

    const matchModifiers =
      modifiers.includes('ctrl') === e.ctrlKey &&
      modifiers.includes('shift') === e.shiftKey &&
      modifiers.includes('alt') === e.altKey &&
      (modifiers.includes('meta') === e.metaKey || modifiers.includes('cmd') === e.metaKey);

    if (!matchModifiers) return false;

    // 如果需要，处理特殊按键映射，或者依赖 e.key
    // 目前进行简单比较。
    // e.key 通常区分大小写（例如 'a', 'A', 'Escape'）
    // 但我们的快捷键配置已转换为小写。
    // 所以比较 e.key.toLowerCase()

    return e.key.toLowerCase() === key;
  }

  private handleKeydown = async (e: KeyboardEvent) => {
    if (this.isExecuting) return;
    this.isExecuting = true;

    // 创建副本以避免在执行期间添加/删除监听器导致的问题
    // 反转数组以执行 LIFO（后进先出）
    const snapshot = [...this.listeners].reverse();

    try {
      for (const listener of snapshot) {
        try {
          const result = await listener(e);
          // 如果监听器返回 true，则阻止传播给其他监听器
          if (result === true) {
            break;
          }
        } catch (error) {
          logger.error('执行快捷键监听器时出错:', error);
          // 尽管出错，仍继续执行下一个监听器
        }
      }
    } finally {
      this.isExecuting = false;
    }
  };
}

const shortcutService = new ShortcutService();
export default shortcutService;
