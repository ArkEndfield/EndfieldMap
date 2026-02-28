import { logger } from '@endfieldmap/tools';

/**
 * 内部监听器信息
 */
interface ListenerInfo {
  handler: globalThis.EventListener;
  event: string;
  once: boolean;
}

type DisposeListenerFn = () => void;

/**
 * 泛型事件监听器类型
 */
export type EventListener<
  TEventMap extends Record<string, unknown>,
  T extends keyof TEventMap & string,
> = (event: TEventMap[T]) => void;

/**
 * 泛型事件监听器联合类型
 * 所有可能的 listener 签名的联合
 */
export type EventListenerUnion<TEventMap extends Record<string, unknown>> = {
  [K in keyof TEventMap & string]: (event: TEventMap[K]) => void;
}[keyof TEventMap & string];

/**
 * 通用地图事件发射器
 * 提供类型安全的事件订阅/发布机制
 * TEventMap 泛型参数允许不同适配器定义自己的事件类型
 *
 * 内部 listenerMap 使用 object 作为 key 类型（函数是 object 子类型），
 * 避免泛型参数通过内部状态泄漏到结构化类型检查中，
 * 确保 EndfieldMapEmitter<A> 与 EndfieldMapEmitter<B> 在公共 API 兼容时可以互相赋值
 */
export class EndfieldMapEmitter<TEventMap extends Record<string, unknown> = Record<string, unknown>> {
  private eventCenter = new EventTarget();
  private listenerMap = new Map<object, ListenerInfo>();
  private listenerCounts = new Map<string, number>();

  /**
   * 注册事件监听器
   */
  public on<T extends keyof TEventMap & string>(
    event: T,
    listener: (event: TEventMap[T]) => void,
    options?: { once?: boolean }
  ): DisposeListenerFn {
    const isOnce = options?.once ?? false;

    const handler: globalThis.EventListener = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<TEventMap[T]>;
        listener(customEvent.detail);
      } catch (error) {
        logger.error(`[EndfieldMapEmitter] Error in listener for event "${event}":`, error);
      }

      if (isOnce) {
        this.off(event, listener);
      }
    };

    this.eventCenter.addEventListener(event, handler);
    this.listenerMap.set(listener, { handler, event, once: isOnce });

    const currentCount = this.listenerCounts.get(event) ?? 0;
    this.listenerCounts.set(event, currentCount + 1);

    return () => {
      this.off(event, listener);
    };
  }

  /**
   * 注册一次性事件监听器
   */
  public once<T extends keyof TEventMap & string>(
    event: T,
    listener: (event: TEventMap[T]) => void
  ): DisposeListenerFn {
    return this.on(event, listener, { once: true });
  }

  /**
   * 触发事件
   */
  public fire<T extends keyof TEventMap & string>(event: T, detail: TEventMap[T]) {
    this.eventCenter.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /**
   * 移除指定的事件监听器
   */
  public off<T extends keyof TEventMap & string>(event: T, listener: (event: TEventMap[T]) => void) {
    const info = this.listenerMap.get(listener);
    if (info) {
      this.eventCenter.removeEventListener(event, info.handler);
      this.listenerMap.delete(listener);

      const currentCount = this.listenerCounts.get(event) ?? 0;
      if (currentCount > 0) {
        this.listenerCounts.set(event, currentCount - 1);
      }
    }
  }

  /**
   * 移除指定事件的所有监听器，或移除所有事件的所有监听器
   */
  public removeAllListeners<T extends keyof TEventMap & string>(event?: T): void {
    if (event) {
      // 只移除属于指定 event 的 listener
      for (const [listener, info] of this.listenerMap.entries()) {
        if (info.event === event) {
          this.eventCenter.removeEventListener(event, info.handler);
          this.listenerMap.delete(listener);
        }
      }
      this.listenerCounts.set(event, 0);
    } else {
      // 移除所有 listener，使用记录的 event 名正确清理 EventTarget
      for (const [, info] of this.listenerMap.entries()) {
        this.eventCenter.removeEventListener(info.event, info.handler);
      }
      this.listenerMap.clear();
      this.listenerCounts.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   */
  public listenerCount<T extends keyof TEventMap & string>(event: T): number {
    return this.listenerCounts.get(event) ?? 0;
  }

  /**
   * 获取所有事件的监听器数量
   */
  public getAllListenerCounts(): Map<string, number> {
    return new Map(this.listenerCounts);
  }

  /**
   * 检查指定事件是否有监听器
   */
  public hasListeners<T extends keyof TEventMap & string>(event: T): boolean {
    return this.listenerCount(event) > 0;
  }
}
