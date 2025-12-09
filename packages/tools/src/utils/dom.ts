import { debounce, throttle } from '@endfieldmap/tools/utils/optimization';

export interface DomEventOptions extends AddEventListenerOptions {
  /** 防抖延迟时间 (ms) */
  debounce?: number;
  /** 节流间隔时间 (ms) */
  throttle?: number;
}

/**
 * 添加 DOM 事件监听器，支持防抖和节流
 * @param dom 目标 DOM 元素
 * @param event 事件名称
 * @param listener 事件监听回调
 * @param options 配置选项 (支持防抖、节流及原生的 AddEventListenerOptions)
 * @returns 移除监听器的函数
 */
export function domEventListener<K extends keyof WindowEventMap>(
  dom: Window,
  event: K,
  listener: (this: Window, ev: WindowEventMap[K]) => void,
  options?: DomEventOptions
): () => void;

export function domEventListener<K extends keyof DocumentEventMap>(
  dom: Document,
  event: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => void,
  options?: DomEventOptions
): () => void;

export function domEventListener<K extends keyof HTMLElementEventMap, E extends HTMLElement>(
  dom: E,
  event: K,
  listener: (this: E, ev: HTMLElementEventMap[K]) => void,
  options?: DomEventOptions
): () => void;

/**
 * 通用事件监听器 overload，用于 custom event 或非标准 event (如 gesturestart)
 */
export function domEventListener(
  dom: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: DomEventOptions
): () => void;

export function domEventListener(
  dom: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: DomEventOptions
): () => void {
  let eventHandler = listener;

  // 如果传递的是对象类型的 listener (HandleEvent)，则取出其 handleEvent 方法
  const callback = typeof listener === 'object' ? listener.handleEvent : listener;

  if (typeof callback === 'function') {
    // 显式转换为通用事件处理函数类型，避免使用 any
    const fn = callback as (event: Event) => void;

    if (options?.debounce) {
      // 使用防抖
      const debounced = debounce(fn, options.debounce);
      eventHandler =
        typeof listener === 'object' ? { ...listener, handleEvent: debounced } : (debounced as EventListener);
    } else if (options?.throttle) {
      // 使用节流
      const throttled = throttle(fn, options.throttle);
      eventHandler =
        typeof listener === 'object' ? { ...listener, handleEvent: throttled } : (throttled as EventListener);
    }
  }

  dom.addEventListener(event, eventHandler, options);

  return () => {
    dom.removeEventListener(event, eventHandler, options);
  };
}
