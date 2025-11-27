// 禁止网页缩放功能
export const disablePageZoom = () => {
  // 阻止键盘缩放 (Ctrl + 加号/减号)
  document.addEventListener('keydown', e => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === '+' ||
        e.key === '-' ||
        e.key === '=' ||
        e.key === '_' ||
        e.keyCode === 187 ||
        e.keyCode === 189)
    ) {
      e.preventDefault();
      return false;
    }
  });

  // 阻止鼠标滚轮缩放 (Ctrl + 滚轮)
  document.addEventListener(
    'wheel',
    e => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
      }
    },
    { passive: false }
  );

  // 阻止触摸板缩放手势
  document.addEventListener('gesturestart', e => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('gesturechange', e => {
    e.preventDefault();
    return false;
  });

  // 阻止双指触摸缩放
  document.addEventListener(
    'touchmove',
    e => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
};