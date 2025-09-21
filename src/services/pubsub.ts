import { throttle, debounce } from '@/utils/common';
import { frameThrottle } from '@/utils/animationTimer';

type Callback = (...args: any[]) => void;
type Unsubscribe = () => void;
type ThrottleOptions = { delay: number; leading?: boolean; trailing?: boolean };
type DebounceOptions = { delay: number; leading?: boolean; trailing?: boolean };

class PubSub {
  private events: Map<string, Set<Callback>> = new Map();
  private throttledEvents: Map<string, Map<Callback, Callback>> = new Map();
  private debouncedEvents: Map<string, Map<Callback, Callback>> = new Map();
  private queuedEvents: Map<string, any[][]> = new Map();
  private isPublishing = false;
  private static instance: PubSub;

  private constructor() {}

  public static getInstance(): PubSub {
    if (!PubSub.instance) {
      PubSub.instance = new PubSub();
    }
    return PubSub.instance;
  }

  /**
   * 订阅事件
   * @param event 事件名
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  public subscribe(event: string, callback: Callback): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(callback);

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  /**
   * 使用节流订阅事件
   * @param event 事件名
   * @param callback 回调函数
   * @param options 节流选项
   * @returns 取消订阅函数
   */
  public throttledSubscribe(
    event: string,
    callback: Callback,
    options: ThrottleOptions
  ): Unsubscribe {
    if (!this.throttledEvents.has(event)) {
      this.throttledEvents.set(event, new Map());
    }

    const throttledCallback = throttle(callback, options.delay, {
      leading: options.leading,
      trailing: options.trailing,
    });

    this.throttledEvents.get(event)?.set(callback, throttledCallback);
    return this.subscribe(event, throttledCallback);
  }

  /**
   * 使用帧节流订阅事件（每N帧最多执行一次）
   * @param event 事件名
   * @param callback 回调函数
   * @param frameCount 帧数
   * @returns 取消订阅函数
   */
  public frameThrottledSubscribe(
    event: string,
    callback: Callback,
    frameCount: number = 1
  ): Unsubscribe {
    if (!this.throttledEvents.has(event)) {
      this.throttledEvents.set(event, new Map());
    }

    const frameThrottledCallback = frameThrottle(callback, frameCount);
    this.throttledEvents.get(event)?.set(callback, frameThrottledCallback);
    return this.subscribe(event, frameThrottledCallback);
  }

  /**
   * 使用防抖订阅事件
   * @param event 事件名
   * @param callback 回调函数
   * @param options 防抖选项
   * @returns 取消订阅函数
   */
  public debouncedSubscribe(
    event: string,
    callback: Callback,
    options: DebounceOptions
  ): Unsubscribe {
    if (!this.debouncedEvents.has(event)) {
      this.debouncedEvents.set(event, new Map());
    }

    const debouncedCallback = debounce(callback, options.delay, {
      leading: options.leading,
      trailing: options.trailing,
    });

    this.debouncedEvents
      .get(event)
      ?.set(callback, debouncedCallback as Callback);
    return this.subscribe(event, debouncedCallback as Callback);
  }

  /**
   * 取消订阅
   * @param event 事件名
   * @param callback 原始回调函数
   */
  public unsubscribe(event: string, callback: Callback): void {
    // 处理常规订阅
    this.events.get(event)?.delete(callback);

    // 处理节流订阅
    if (this.throttledEvents.has(event)) {
      const throttledCallback = this.throttledEvents.get(event)?.get(callback);
      if (throttledCallback) {
        this.events.get(event)?.delete(throttledCallback);
        this.throttledEvents.get(event)?.delete(callback);
      }
    }

    // 处理防抖订阅
    if (this.debouncedEvents.has(event)) {
      const debouncedCallback = this.debouncedEvents.get(event)?.get(callback);
      if (debouncedCallback) {
        this.events.get(event)?.delete(debouncedCallback);
        this.debouncedEvents.get(event)?.delete(callback);
      }
    }
  }

  /**
   * 发布事件
   * @param event 事件名
   * @param args 参数
   */
  public publish(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks || callbacks.size === 0) return;

    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * 启用批量发布模式
   * 将事件放入队列，在下一个微任务批量处理
   * @param event 事件名
   * @param args 参数
   */
  public queuePublish(event: string, ...args: any[]): void {
    if (!this.queuedEvents.has(event)) {
      this.queuedEvents.set(event, []);
    }
    this.queuedEvents.get(event)?.push(args);

    if (!this.isPublishing) {
      this.isPublishing = true;
      queueMicrotask(() => this.processQueue());
    }
  }

  private processQueue(): void {
    this.queuedEvents.forEach((argsArray, event) => {
      const callbacks = this.events.get(event);
      if (callbacks && callbacks.size > 0 && argsArray.length > 0) {
        callbacks.forEach(callback => {
          try {
            // 对每个回调只执行最后一个事件（减少不必要的执行）
            const lastArgs = argsArray[argsArray.length - 1];
            callback(...lastArgs);
          } catch (error) {
            console.error(`Error in queued ${event} callback:`, error);
          }
        });
      }
      // 清空已处理的事件
      argsArray.length = 0;
    });

    this.isPublishing = false;
  }

  /**
   * 清除事件
   * @param event 事件名（可选，不提供则清除所有事件）
   */
  public clear(event?: string): void {
    if (event) {
      this.events.delete(event);
      this.throttledEvents.delete(event);
      this.debouncedEvents.delete(event);
      this.queuedEvents.delete(event);
    } else {
      this.events.clear();
      this.throttledEvents.clear();
      this.debouncedEvents.clear();
      this.queuedEvents.clear();
    }
  }
}

export const pubsub = PubSub.getInstance();

// 定义事件名称常量
export const EVENTS = {
  MARK_CHANGE: 'mark_change',
  MULTI_SELECT_STATE_CHANGE: 'multi_select_state_change',
  MULTI_SELECT_CHANGE: 'multi_select_change',
  SELECT_CHANGE: 'select_change',
  SETTINGS_CHANGE: 'settings_change',
  CONNECTION_FAILED: 'connection_failed',
  CONNECTION_SUCCESS: 'connection_success',
  POLE_CONNECTION_CHANGED: 'pole_connection_changed',
} as const;
