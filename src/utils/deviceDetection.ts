// 检测设备类型的工具函数

/**
 * 判断当前设备是否为移动设备
 * @returns {boolean} 如果是移动设备则返回true，否则返回false
 */
export function isMobileDevice(): boolean {
  // 检查是否存在window对象（防止服务端渲染报错）
  if (typeof window === 'undefined') return false;

  // 使用userAgent检测移动设备
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  // 检测常见移动设备的userAgent特征
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // 通过屏幕宽度也进行检测（通常移动设备宽度小于768px）
  const isMobileWidth = window.innerWidth < 768;

  return mobileRegex.test(userAgent) || isMobileWidth;
}

/**
 * 监听窗口大小变化，返回是否为移动设备视口
 * @param callback 视口类型变化的回调函数
 * @returns 取消监听的函数
 */
export function watchDeviceType(
  callback: (isMobile: boolean) => void
): () => void {
  // 初始检测
  let currentIsMobile = isMobileDevice();
  callback(currentIsMobile);

  // 监听窗口大小变化
  const handleResize = () => {
    const newIsMobile = isMobileDevice();
    if (newIsMobile !== currentIsMobile) {
      currentIsMobile = newIsMobile;
      callback(currentIsMobile);
    }
  };

  window.addEventListener('resize', handleResize);

  // 返回取消监听的函数
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
