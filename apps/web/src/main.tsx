import '@/services/logger.ts';
import '@/index.css';

import { WebStorageAdapter } from '@endfieldmap/storage-web';
import { disablePageZoom, registerStorageAdapter } from '@endfieldmap/tools';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(<App />);
