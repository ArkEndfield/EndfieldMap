import Control from 'ol/control/Control';

/**
 * 创建缩放控件实例
 * @param controlsElement 控件的 HTML 元素
 */
export function createZoomControl(controlsElement: HTMLElement): Control {
  return new Control({
    element: controlsElement,
  });
}
