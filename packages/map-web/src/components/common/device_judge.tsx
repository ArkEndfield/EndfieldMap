import React from 'react';

import { useIsMobile } from '@/hooks/use_is_mobile';

export default function deviceJudge<T extends object>(
  PCComponent: React.FC<T>,
  MobileComponent: React.FC<T>,
  ExtraWrapper?: React.FC<{ children: React.ReactNode }>
): React.FC<T> {
  return (props: T) => {
    const isMobile = useIsMobile();
    if (isMobile) {
      return ExtraWrapper ? (
        <ExtraWrapper>
          <MobileComponent {...props} />
        </ExtraWrapper>
      ) : (
        <MobileComponent {...props} />
      );
    } else {
      return ExtraWrapper ? (
        <ExtraWrapper>
          <PCComponent {...props} />
        </ExtraWrapper>
      ) : (
        <PCComponent {...props} />
      );
    }
  };
}
