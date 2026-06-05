import '@/services/logger.ts';
import '@/index.css';

import { WebStorageAdapter } from '@endfieldmap/storage-web';
import { disablePageZoom, registerStorageAdapter } from '@endfieldmap/tools';
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

export function SWUpdatePrompt() {
  const { t } = useTranslation('common');
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
