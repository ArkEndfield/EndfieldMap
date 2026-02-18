import '@/services/logger.ts';
import '@/index.css';

import { disablePageZoom } from '@endfieldmap/tools';
import { createRoot } from 'react-dom/client';
import { scan } from 'react-scan';

import App from '@/App.tsx';
import { isDev, isScanEnabled } from '@/services/env';

if (!isDev) disablePageZoom();
if (isScanEnabled) {
  scan({
    enabled: isDev,
  });
}

createRoot(document.getElementById('root')!).render(<App />);
