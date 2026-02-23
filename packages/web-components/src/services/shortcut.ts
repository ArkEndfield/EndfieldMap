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

type Combo1 = `${Modifier}+${Key}`;
type Combo2 = `${Modifier}+${Modifier}+${Key}`;
type Combo3 = `${Modifier}+${Modifier}+${Modifier}+${Key}`;

export type ShortcutString = Key | Combo1 | Combo2 | Combo3 | (string & {});

class ShortcutService {
  private listeners: ShortcutListener[] = [];
  private isExecuting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

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

    return e.key.toLowerCase() === key;
  }

  private handleKeydown = async (e: KeyboardEvent) => {
    if (this.isExecuting) return;
    this.isExecuting = true;

    const snapshot = [...this.listeners].reverse();

    try {
      for (const listener of snapshot) {
        try {
          const result = await listener(e);
          if (result === true) {
            break;
          }
        } catch (error) {
          logger.error('执行快捷键监听器时出错:', error);
        }
      }
    } finally {
      this.isExecuting = false;
    }
  };
}

const shortcutService = new ShortcutService();
export default shortcutService;
