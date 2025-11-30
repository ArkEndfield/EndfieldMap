import '@/services/logger.ts';
import '@/i18n';
import '@/index.css';

import { disablePageZoom } from '@endfieldmap/tools';
import { createRoot } from 'react-dom/client';

import App from '@/App.tsx';
import { isDev } from '@/services/env';

if (!isDev) disablePageZoom();

createRoot(document.getElementById('root')!).render(<App />);
