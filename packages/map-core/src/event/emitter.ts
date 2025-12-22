import { logger } from '@endfieldmap/tools';

import type {
  DisposeListener,
  ListenerOptions,
  MapEventEmitter,
  MapEventListener,
  MapEventListenerUnion,
} from '@endfieldmap/map-core/types/event';

/**
 * 内部监听器信息
 */
interface ListenerInfo {
  handler: EventListener;
  once: boolean;
}

/**
 * EndfieldMap 事件发射器
 * 提供类型安全的事件订阅/发布机制
 */
export class EndfieldMapEmitter {
  private eventCenter = new EventTarget();
  private listenerMap = new Map<MapEventListenerUnion, ListenerInfo>();
  private listenerCounts = new Map<string, number>();

  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param listener 监听器函数
   * @param options 监听器选项
   * @returns 取消监听的函数
   */
  public on<T extends keyof MapEventEmitter>(
    event: T,
    listener: MapEventListener<T>,
    options?: ListenerOptions
  ): DisposeListener {
    const isOnce = options?.once ?? false;

    const handler = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<MapEventEmitter[T]>;
        listener(customEvent.detail);
      } catch (error) {
        // 错误边界：监听器抛出异常不影响其他监听器
        logger.error(`[EndfieldMapEmitter] Error in listener for event "${event}":`, error);
      }

      // 如果是 once 监听器，执行后自动移除
      if (isOnce) {
        this.off(event, listener);
      }
    };

    this.eventCenter.addEventListener(event, handler);
    this.listenerMap.set(listener as MapEventListenerUnion, { handler, once: isOnce });

    // 更新监听器计数
    const currentCount = this.listenerCounts.get(event) ?? 0;
    this.listenerCounts.set(event, currentCount + 1);

    return () => {
      this.off(event, listener);
    };
  }

  /**
   * 注册一次性事件监听器
   * 监听器在触发一次后自动移除
   * @param event 事件名称
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  public once<T extends keyof MapEventEmitter>(event: T, listener: MapEventListener<T>): DisposeListener {
    return this.on(event, listener, { once: true });
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param detail 事件详情
   */
  public fire<T extends keyof MapEventEmitter>(event: T, detail: MapEventEmitter[T]) {
    this.eventCenter.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /**
   * 移除指定的事件监听器
   * @param event 事件名称
   * @param listener 监听器函数
   */
  public off<T extends keyof MapEventEmitter>(event: T, listener: MapEventListener<T>) {
    const info = this.listenerMap.get(listener as MapEventListenerUnion);
    if (info) {
      this.eventCenter.removeEventListener(event, info.handler);
      this.listenerMap.delete(listener as MapEventListenerUnion);

      // 更新监听器计数
      const currentCount = this.listenerCounts.get(event) ?? 0;
      if (currentCount > 0) {
        this.listenerCounts.set(event, currentCount - 1);
      }
    }
  }

  /**
   * 移除指定事件的所有监听器
   * @param event 事件名称，如果不提供则移除所有事件的监听器
   */
  public removeAllListeners<T extends keyof MapEventEmitter>(event?: T): void {
    if (event) {
      // 移除指定事件的所有监听器
      for (const [listener, info] of this.listenerMap.entries()) {
        this.eventCenter.removeEventListener(event, info.handler);
        this.listenerMap.delete(listener);
      }
      this.listenerCounts.set(event, 0);
    } else {
      // 移除所有事件的监听器
      for (const [listener, _info] of this.listenerMap.entries()) {
        // 由于我们不知道具体的事件名，需要遍历所有可能的事件
        this.listenerMap.delete(listener);
      }
      this.listenerCounts.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  public listenerCount<T extends keyof MapEventEmitter>(event: T): number {
    return this.listenerCounts.get(event) ?? 0;
  }

  /**
   * 获取所有事件的监听器数量
   * @returns 事件名称到监听器数量的映射
   */
  public getAllListenerCounts(): Map<string, number> {
    return new Map(this.listenerCounts);
  }

  /**
   * 检查指定事件是否有监听器
   * @param event 事件名称
   * @returns 是否有监听器
   */
  public hasListeners<T extends keyof MapEventEmitter>(event: T): boolean {
    return this.listenerCount(event) > 0;
  }
}

const mapEventEmitter = new EndfieldMapEmitter();

export default mapEventEmitter;
