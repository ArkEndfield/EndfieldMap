import '@/services/logger.ts';
import '@/i18n';
import '@/index.css';
import { scan } from 'react-scan';

import { disablePageZoom } from '@endfieldmap/tools';
import { createRoot } from 'react-dom/client';

import App from '@/App.tsx';
import { isDev } from '@/services/env';

if (!isDev) disablePageZoom();
scan({
  enabled: isDev,
});

createRoot(document.getElementById('root')!).render(<App />);
