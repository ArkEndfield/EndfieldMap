import React from 'react';
import { observer } from 'mobx-react-lite';
import type { PopupProps } from '@/components/themes/types/popup';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobilePopup from './mobile';
import PCPopup from './pc';

const Popup: React.FC<PopupProps> = observer(({ adapter }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePopup adapter={adapter} />;
  }

  return <PCPopup adapter={adapter} />;
});

export default Popup;
