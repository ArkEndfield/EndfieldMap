import '@/services/logger.ts';
import '@/index.css';

import { WebStorageAdapter } from '@endfieldmap/storage-web';
import { disablePageZoom, registerStorageAdapter } from '@endfieldmap/tools';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { scan } from 'react-scan';

import App from '@/App.tsx';
import { isDev, isScanEnabled } from '@/services/env';

registerStorageAdapter(new WebStorageAdapter());

if (!isDev) disablePageZoom();
if (isScanEnabled) {
  scan({
    enabled: isDev,
  });
}

export function SWUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      const lang = navigator.language.toLowerCase();
      let message: string;
      if (lang.startsWith('zh')) {
        message = 'ZMDMAP 有新版本可用，页面将自动刷新以获取最新内容';
      } else if (lang.startsWith('ja')) {
        message = '新バージョンがあります。ページは自動的に更新されます';
      } else if (lang.startsWith('ko')) {
        message = '새 버전이 있습니다. 페이지가 자동으로 새로고침됩니다';
      } else {
        message = 'New version available, page will refresh to get the latest content';
      }
      alert(message);
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);
  return null;
}

createRoot(document.getElementById('root')!).render(<App />);
