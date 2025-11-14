import { createRoot } from 'react-dom/client';

import '@/services/logger.ts';
import App from '@/App.tsx';

import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);
