import { useEffect, useState } from 'react';

import { useWindow } from '../contexts/window';

export const useIsMobile = () => {
  const currentWindow = useWindow();
  const [isMobile, setIsMobile] = useState(() => {
    return currentWindow.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const mediaQuery = currentWindow.matchMedia('(max-width: 768px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [currentWindow]);

  return isMobile;
};
