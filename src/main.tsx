import { createRoot } from 'react-dom/client';

import '@/services/logger.ts';
import App from '@/App.tsx';

import '@/i18n';

import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);
