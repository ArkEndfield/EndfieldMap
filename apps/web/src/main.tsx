import '@/services/logger.ts';
import '@/index.css';

import { WebStorageAdapter } from '@endfieldmap/storage-web';
import { disablePageZoom, registerStorageAdapter } from '@endfieldmap/tools';
import i18n from 'i18next';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

import App from '@/App.tsx';
import { isDev, isScanEnabled } from '@/services/env';

registerStorageAdapter(new WebStorageAdapter());

if (!isDev) disablePageZoom();
if (isScanEnabled) {
  import('react-scan').then(({ scan }) => scan({ enabled: isDev }));
}

// 无路由单页 + registerType:'autoUpdate' 下，新版本只在浏览器重新拉到新的
// sw.js 后才会自动生效，而更新检查默认只发生在导航/整页刷新时。长期挂着的
// 标签页不会主动发现新版，这里补一个周期性 registration.update()。
// 注意：只有配合托管层给 sw.js / index.html 设 no-cache（见部署配置），
// update() 才能真正拿到新的 sw.js，否则仍会命中 CDN 边缘缓存的旧脚本。
const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 小时

export function SWUpdatePrompt() {
  const { t } = useTranslation('common', { i18n, useSuspense: false });
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, SW_UPDATE_CHECK_INTERVAL_MS);
    },
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    void import('@/components/common/alert/alert_api').then(({ alert }) => {
      alert.info({
        content: <div className="text-center">{t('sw_update_available')}</div>,
        onConfirm: () => {
          updateServiceWorker(true);
        },
      });
    });
  }, [needRefresh, t, updateServiceWorker]);
  return null;
}

createRoot(document.getElementById('root')!).render(<App />);
