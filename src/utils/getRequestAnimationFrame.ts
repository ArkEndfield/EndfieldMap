/**
 * getRequestAnimationFrame.ts
 * 提供跨浏览器兼容的requestAnimationFrame和cancelAnimationFrame函数
 */

// 声明厂商前缀版本的接口，解决TypeScript类型问题
interface WindowWithVendorPrefixes extends Window {
  webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  msRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  oRequestAnimationFrame?: (callback: FrameRequestCallback) => number;

  webkitCancelAnimationFrame?: (handle: number) => void;
  mozCancelAnimationFrame?: (handle: number) => void;
  msCancelAnimationFrame?: (handle: number) => void;
  oCancelAnimationFrame?: (handle: number) => void;
}

/**
 * 获取兼容当前环境的requestAnimationFrame函数
 * @returns requestAnimationFrame函数
 */
export default function getRequestAnimationFrame(): (
  callback: FrameRequestCallback
) => number {
  // 检查浏览器支持的requestAnimationFrame版本
  if (typeof window !== 'undefined') {
    const win = window as WindowWithVendorPrefixes;
    return (
      win.requestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame ||
      win.msRequestAnimationFrame ||
      win.oRequestAnimationFrame ||
      ((callback: FrameRequestCallback) => win.setTimeout(callback, 1000 / 60))
    );
  }

  // 非浏览器环境（例如Node.js或SSR）提供一个简单的polyfill
  return (callback: FrameRequestCallback) => {
    return setTimeout(() => {
      callback(Date.now());
    }, 1000 / 60) as unknown as number;
  };
}

/**
 * 获取兼容当前环境的cancelAnimationFrame函数
 * @param id 需要取消的动画帧请求ID
 */
export function cancelRequestAnimationFrame(id: number): void {
  if (typeof window !== 'undefined') {
    const win = window as WindowWithVendorPrefixes;
    const cancelAnimFrame =
      win.cancelAnimationFrame ||
      win.webkitCancelAnimationFrame ||
      win.mozCancelAnimationFrame ||
      win.msCancelAnimationFrame ||
      win.oCancelAnimationFrame ||
      win.clearTimeout;

    cancelAnimFrame(id);
  } else {
    // 非浏览器环境
    clearTimeout(id);
  }
}

/**
 * 兼容的环境检测，确定当前是否在浏览器环境中
 */
export const isBrowser = typeof window !== 'undefined';
