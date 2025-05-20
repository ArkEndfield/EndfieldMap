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

// src/utils/featureDetection.js

/**
 * 检测浏览器对 linear-gradient 的 Hue 插值方法支持
 * @returns {boolean} 是否支持该特性
 */
export function supportsHueInterpolation() {
  // 创建一个用于测试的元素
  const testElement = document.createElement('div');

  // 设置测试渐变
  testElement.style.backgroundImage = 'linear-gradient(in hue, red, blue)';

  // 获取计算样式并检查是否包含"hue"
  const computedStyle = window.getComputedStyle(testElement).backgroundImage;

  // 如果包含 "hue" 关键字，说明浏览器支持该特性
  return computedStyle.includes('hue');
}

/**
 * 使用CSS @supports API检测特性支持
 * 这是更现代的检测方法
 * @returns {boolean} 是否支持该特性
 */
export function supportsHueInterpolationCSS(): boolean {
  if (window.CSS && !!window.CSS.supports) {
    try {
      return CSS.supports(
        'background-image',
        'linear-gradient(in hue, red, blue)'
      );
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * 检测浏览器版本是否满足最低要求
 * 针对各主要浏览器设置对应最低版本
 * @returns {boolean} 是否满足版本要求
 */
export function meetsVersionRequirements() {
  const ua = navigator.userAgent;

  // 检测Chrome/Edge (Chromium)
  const chromeMatch = ua.match(/(?:Chrome|Chromium|Edg(?:e|A|iOS))\/(\d+)/i);
  if (chromeMatch && parseInt(chromeMatch[1]) >= 111) {
    return true;
  }

  // 检测Firefox
  const firefoxMatch = ua.match(/(?:Firefox|FxiOS)\/(\d+)/i);
  if (firefoxMatch && parseInt(firefoxMatch[1]) >= 127) {
    return true;
  }

  // 检测Safari
  // Safari版本检测较复杂，因为iOS和macOS上的版本标识不同
  const safariMatch = ua.match(/Version\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari/i);
  if (safariMatch) {
    const majorVersion = parseInt(safariMatch[1]);
    const minorVersion = parseInt(safariMatch[2]);

    // Safari 16.2+
    if (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 2)) {
      return true;
    }
  }

  // 检测Opera
  const operaMatch = ua.match(/(?:Opera|OPR|Opera Coast|OPiOS)\/(\d+)/i);
  if (operaMatch && parseInt(operaMatch[1]) >= 97) {
    return true;
  }

  // 检测Samsung Internet
  const samsungMatch = ua.match(/SamsungBrowser\/(\d+)/i);
  if (samsungMatch && parseInt(samsungMatch[1]) >= 22) {
    return true;
  }

  // 如果都不匹配，默认为不支持
  return false;
}

/**
 * 获取当前浏览器名称和版本（仅用于展示）
 * @returns {Object} 浏览器信息
 */
export function getBrowserInfo(): { browserName: string; version: string } {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let version = 'Unknown';

  // Chrome
  if (ua.match(/Chrome/i) && !ua.match(/Edg/i) && !ua.match(/OPR/i)) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // Edge
  else if (ua.match(/Edg/i)) {
    browserName = 'Edge';
    const match = ua.match(/Edg(?:e|A|iOS)\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // Firefox
  else if (ua.match(/Firefox/i)) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // Safari
  else if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // Opera
  else if (ua.match(/OPR/i) || ua.match(/Opera/i)) {
    browserName = 'Opera';
    const match = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }
  // Samsung Internet
  else if (ua.match(/SamsungBrowser/i)) {
    browserName = 'Samsung Internet';
    const match = ua.match(/SamsungBrowser\/(\d+\.\d+)/i);
    if (match) version = match[1];
  }

  return { browserName, version };
}

/**
 * 综合检测方法
 * 优先使用特性检测，如果特性检测不明确则回退到版本检测
 * @returns {boolean} 浏览器是否支持所需特性
 */
export function browserSupportsRequiredFeatures(): boolean {
  // 首先尝试使用CSS @supports检测
  if (supportsHueInterpolationCSS()) {
    return true;
  }

  // 如果@supports不可用，尝试DOM检测
  const domDetectionResult = supportsHueInterpolation();
  if (domDetectionResult === true) {
    return true;
  }

  // 如果DOM检测结果不明确，检查浏览器版本
  return meetsVersionRequirements();
}
