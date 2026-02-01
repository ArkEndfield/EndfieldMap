import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { domEventListener } from '@endfieldmap/tools';
import type View from 'ol/View';

export interface KeyboardMoveControllerConfig {
  /** 移动速度（像素级，默认 8） */
  speed?: number;
  /** 是否启用（默认 true） */
  enable?: boolean;
}

/**
 * KeyboardMoveController
 * WASD 控制地图平移（支持斜向 & 连续）
 */
export class KeyboardMoveController {
  private view: View;
  private speed: number;
  private enable: boolean;
  private disposer?: () => void;

  private keyState = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  private rafId: number | null = null;

  constructor(config: KeyboardMoveControllerConfig) {
    const mapInstance = EndfieldMap.getInstance();
    this.view = mapInstance.map.getView();
    this.speed = config.speed ?? 1;
    this.enable = config.enable ?? true;

    this.bindEvents();
    // 不在初始化时启动循环，而是在按键按下时才启动
  }

  private bindEvents() {
    if (this.disposer) {
      this.disposer();
    }
    const disposer1 = domEventListener(window, 'keydown', this.handleKeyDown);
    const disposer2 = domEventListener(window, 'keyup', this.handleKeyUp);
    this.disposer = () => {
      disposer1();
      disposer2();
    };
  }

  private unbindEvents() {
    if (this.disposer) {
      this.disposer();
      this.disposer = void 0;
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.enable) return;
    if (this.isInputTarget(e.target)) return;

    const key = e.key.toLowerCase() as keyof typeof this.keyState;

    if (key in this.keyState) {
      const wasAllFalse = !this.keyState.w && !this.keyState.a && !this.keyState.s && !this.keyState.d;
      this.keyState[key] = true;
      e.preventDefault();

      // 只在从"无按键"变为"有按键"时启动循环
      if (wasAllFalse && this.rafId === null) {
        this.startLoop();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase() as keyof typeof this.keyState;

    if (key in this.keyState) {
      this.keyState[key] = false;

      // 如果所有按键都释放了，停止循环
      if (!this.keyState.w && !this.keyState.a && !this.keyState.s && !this.keyState.d) {
        this.stopLoop();
      }
    }
  };

  private startLoop() {
    // 防止重复启动
    if (this.rafId !== null) return;

    const loop = () => {
      if (!this.enable) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      const { w, a, s, d } = this.keyState;

      // 没有按键时停止循环
      if (!w && !a && !s && !d) {
        this.stopLoop();
        return;
      }

      const resolution = this.view.getResolution();
      const center = this.view.getCenter();

      if (!resolution || !center) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      let dx = 0;
      let dy = 0;

      if (w) dy += 1;
      if (s) dy -= 1;
      if (a) dx -= 1;
      if (d) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
      }

      const move = this.speed * resolution * 10;

      this.view.setCenter([center[0] + dx * move, center[1] + dy * move]);

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public enableController() {
    this.enable = true;
  }

  public disableController() {
    this.enable = false;
    this.resetKeyState();
    this.stopLoop();
  }

  public setSpeed(speed: number) {
    this.speed = speed;
  }

  public dispose() {
    this.resetKeyState();
    this.unbindEvents();
    this.stopLoop();
  }

  private resetKeyState() {
    this.keyState.w = false;
    this.keyState.a = false;
    this.keyState.s = false;
    this.keyState.d = false;
  }

  private isInputTarget(target: EventTarget | null): boolean {
    if (!target) return false;
    if (!(target instanceof HTMLElement)) return false;

    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
  }
}
