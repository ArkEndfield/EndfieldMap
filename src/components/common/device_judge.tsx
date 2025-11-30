import React from 'react';

import { useIsMobile } from '@/hooks/use_is_mobile';

export default function deviceJudge<T extends object>(
  PCComponent: React.FC<T>,
  MobileComponent: React.FC<T>
): React.FC<T> {
  return (props: T) => {
    const isMobile = useIsMobile();
    if (isMobile) {
      return <MobileComponent {...props} />;
    } else {
      return <PCComponent {...props} />;
    }
  };
}
