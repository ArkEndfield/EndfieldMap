import { useState, useEffect } from 'react';

const mediaQuery = window.matchMedia('(max-width: 768px)');

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(mediaQuery.matches);

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile;
};
